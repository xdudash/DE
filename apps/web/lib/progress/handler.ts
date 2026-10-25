/** Authenticated read and consented-import handlers for account learning evidence. */
import { AttemptError, importAttempts, MAX_IMPORT_ATTEMPTS, parseAttemptRequest, type Store } from "@deutschgo/attempts";
import type { ContentBundle } from "@deutschgo/content-kit";
import { graphFromBundle } from "@deutschgo/learning-engine";
import { AuthNotConfigured, TokenInvalid, type Session } from "../auth/session.ts";

export interface ProgressHandlerDeps {
  bundle(): ContentBundle;
  storeFor(userId: string): Store | null;
  session(request: Request): Session | null | Promise<Session | null>;
  now(): number;
  limit?(userId: string): Promise<Response | null>;
}

function problem(status: number, error: string, message: string, detail?: string): Response {
  const body: { error: string; message: string; detail?: string } = { error, message };
  if (detail) body.detail = detail;
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

async function learner(request: Request, deps: ProgressHandlerDeps): Promise<{ userId: string } | Response> {
  try {
    const session = await deps.session(request);
    return session ?? problem(401, "not_signed_in", "sign in to read or import account progress");
  } catch (err) {
    if (err instanceof TokenInvalid) return problem(401, "invalid_token", "the session token was rejected; sign in again");
    if (err instanceof AuthNotConfigured) return problem(503, "auth_not_configured", "sessions cannot be verified right now");
    throw err;
  }
}

/** Returns account events under RLS; callers must never cache this response. */
export async function handleGetProgress(request: Request, deps: ProgressHandlerDeps): Promise<Response> {
  if (request.method !== "GET") return problem(405, "method_not_allowed", "use GET");
  const identity = await learner(request, deps);
  if (identity instanceof Response) return identity;
  const store = deps.storeFor(identity.userId);
  if (!store) return problem(503, "storage_not_configured", "this deployment cannot read learner data");
  const concepts = graphFromBundle(deps.bundle()).map((concept) => concept.id);
  const events = await store.eventsForConcepts(concepts);
  return Response.json({ events }, { headers: { "cache-control": "no-store" } });
}

/** Re-evaluates a learner-approved batch and inserts only server-verified events. */
export async function handleImportProgress(request: Request, deps: ProgressHandlerDeps): Promise<Response> {
  if (request.method !== "POST") return problem(405, "method_not_allowed", "use POST");
  const identity = await learner(request, deps);
  if (identity instanceof Response) return identity;
  if (deps.limit) {
    const refused = await deps.limit(identity.userId);
    if (refused) return refused;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return problem(400, "malformed_request", "body is not valid JSON");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body) || !Array.isArray((body as Record<string, unknown>).attempts)) {
    return problem(400, "malformed_request", 'body must contain an "attempts" array');
  }
  const raw = (body as { attempts: unknown[] }).attempts;
  if (raw.length === 0 || raw.length > MAX_IMPORT_ATTEMPTS) {
    return problem(400, "malformed_request", `attempts must contain 1 to ${MAX_IMPORT_ATTEMPTS} answers`);
  }

  let attempts;
  try {
    attempts = raw.map(parseAttemptRequest);
  } catch (err) {
    if (err instanceof AttemptError) return problem(err.status, err.code, err.message, err.detail);
    throw err;
  }

  const store = deps.storeFor(identity.userId);
  if (!store) return problem(503, "storage_not_configured", "this deployment cannot store learner data");
  try {
    const result = await importAttempts(attempts, {
      bundle: deps.bundle(), store, userId: identity.userId, now: deps.now(),
    });
    return Response.json(result, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    if (err instanceof AttemptError) return problem(err.status, err.code, err.message, err.detail);
    throw err;
  }
}
