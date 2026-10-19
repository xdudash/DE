/**
 * HTTP shape of the 16+ age gate, independent of Next.js and of the database, so every
 * status code is testable without a server. The route adapter injects the real
 * dependencies (app/api/profile/age-gate/route.ts).
 *
 * The gate stores a boolean assertion only. No birth date is ever collected
 * (DATA_AND_PRIVACY, profiles.age_confirmed).
 */
import type { Session } from "../auth/session.ts";
import { AuthNotConfigured, TokenInvalid } from "../auth/session.ts";

export interface AgeGateStore {
  /** Records the learner's own 16+ assertion. Idempotent: confirming twice is fine. */
  confirmAge(userId: string): Promise<void>;
}

export interface AgeGateDeps {
  /** Null when this deployment has no database: the request is refused, not dropped. */
  storeFor(userId: string): AgeGateStore | null;
  session(request: Request): Session | null;
}

interface ErrorBody {
  error: string;
  message: string;
}

function problem(status: number, error: string, message: string): Response {
  const body: ErrorBody = { error, message };
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

/** The only accepted assertion is exactly `{ "over16": true }`. Anything else is refused. */
export function isOver16Assertion(body: unknown): boolean {
  return typeof body === "object" && body !== null && !Array.isArray(body)
    && (body as { over16?: unknown }).over16 === true
    && Object.keys(body).length === 1;
}

export async function handleAgeGate(request: Request, deps: AgeGateDeps): Promise<Response> {
  if (request.method !== "POST") return problem(405, "method_not_allowed", "use POST");

  let session: Session | null;
  try {
    session = deps.session(request);
  } catch (err) {
    if (err instanceof TokenInvalid) return problem(401, "invalid_token", err.message);
    if (err instanceof AuthNotConfigured) return problem(503, "auth_not_configured", err.message);
    throw err;
  }
  if (!session) return problem(401, "not_signed_in", "sign in to confirm your age");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return problem(400, "malformed_request", "body is not valid JSON");
  }
  if (!isOver16Assertion(body)) {
    return problem(422, "age_gate_requires_assertion", 'send exactly {"over16": true}; DeutschGo is for learners aged 16 and over');
  }

  const store = deps.storeFor(session.userId);
  if (!store) return problem(503, "database_not_configured", "this deployment cannot store learner data");

  // A failing write propagates as an error: the client must never see "confirmed" for a
  // write that did not happen.
  await store.confirmAge(session.userId);
  return Response.json({ ageConfirmed: true }, { headers: { "cache-control": "no-store" } });
}
