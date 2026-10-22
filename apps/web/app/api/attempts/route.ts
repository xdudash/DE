/**
 * POST /api/attempts — records one exercise attempt.
 *
 * Thin adapter: dependencies live in lib/, the status codes are defined and tested in
 * lib/attempts/handler.ts. Until sign-in exists (DG-015) a browser carries no token,
 * so this endpoint answers 401 and the lesson page keeps saying progress is not saved.
 */
import { attemptStore } from "../../../lib/data/attempt-store.ts";
import { isConfigured } from "../../../lib/data/pg.ts";
import { handleAttempt } from "../../../lib/attempts/handler.ts";
import { authConfig } from "../../../lib/auth/config.ts";
import { sessionFrom } from "../../../lib/auth/session.ts";
import { bundle } from "../../../lib/content.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function POST(request: Request): Promise<Response> {
  return handleAttempt(request, {
    bundle,
    storeFor: (userId) => (isConfigured() ? attemptStore(userId) : null),
    session: (req) => sessionFrom(req, authConfig(), Math.floor(Date.now() / 1000)),
    now: () => Date.now(),
  });
}
