/**
 * HTTP shape of attempt recording, independent of Next.js and of the database, so
 * every status code is testable without a server or a connection string.
 * The route adapter (app/api/attempts/route.ts) injects the real dependencies.
 */
import { AttemptError, parseAttemptRequest, recordAttempt, type AttemptOutcome, type Store } from "@deutschgo/attempts";
import type { ContentBundle } from "@deutschgo/content-kit";
import { AuthNotConfigured, TokenInvalid, type Session } from "../auth/session.ts";

export interface HandlerDeps {
  bundle(): ContentBundle;
  /** Null when this deployment has no database: the request is refused, not silently dropped. */
  storeFor(userId: string): Store | null;
  session(request: Request): Session | null;
  now(): number;
}

interface ErrorBody {
  error: string;
  message: string;
  detail?: string;
}

function problem(status: number, error: string, message: string, detail?: string): Response {
  const body: ErrorBody = { error, message };
  if (detail) body.detail = detail;
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function handleAttempt(request: Request, deps: HandlerDeps): Promise<Response> {
  if (request.method !== "POST") return problem(405, "method_not_allowed", "use POST");

  let session: Session | null;
  try {
    session = deps.session(request);
  } catch (err) {
    if (err instanceof TokenInvalid) return problem(401, "invalid_token", err.message);
    if (err instanceof AuthNotConfigured) return problem(503, "auth_not_configured", err.message);
    throw err;
  }
  if (!session) {
    return problem(401, "not_signed_in", "sign in to save progress", "answers are still checked in the browser");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return problem(400, "malformed_request", "body is not valid JSON");
  }

  let parsed;
  try {
    parsed = parseAttemptRequest(body);
  } catch (err) {
    if (err instanceof AttemptError) return problem(err.status, err.code, err.message, err.detail);
    throw err;
  }

  const store = deps.storeFor(session.userId);
  if (!store) {
    return problem(503, "storage_not_configured", "this deployment cannot store learner data");
  }

  let outcome: AttemptOutcome;
  try {
    outcome = await recordAttempt(parsed, { bundle: deps.bundle(), store, userId: session.userId, now: deps.now() });
  } catch (err) {
    if (err instanceof AttemptError) return problem(err.status, err.code, err.message, err.detail);
    throw err;
  }
  // 201 only when this request created the event; a replay is a 200 with the same body.
  return Response.json(outcome, { status: outcome.recorded ? 201 : 200, headers: { "cache-control": "no-store" } });
}
