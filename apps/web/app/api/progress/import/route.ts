/** POST /api/progress/import — one explicit, server-re-evaluated local history import. */
import { attemptStore } from "../../../../lib/data/attempt-store.ts";
import { isConfigured } from "../../../../lib/data/pg.ts";
import { authConfig } from "../../../../lib/auth/config.ts";
import { sessionFrom } from "../../../../lib/auth/session.ts";
import { bundle } from "../../../../lib/content.ts";
import { rateLimitStore } from "../../../../lib/data/rate-limit-store.ts";
import { POLICY } from "../../../../lib/rate-limit/policy.ts";
import { guard, subjectKey } from "../../../../lib/rate-limit/limit.ts";
import { handleImportProgress } from "../../../../lib/progress/handler.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function POST(request: Request): Promise<Response> {
  return handleImportProgress(request, {
    bundle,
    storeFor: (userId) => (isConfigured() ? attemptStore(userId) : null),
    session: (req) => sessionFrom(req, authConfig(), Math.floor(Date.now() / 1000)),
    now: () => Date.now(),
    limit: (userId) => guard(rateLimitStore(), POLICY.attempts, subjectKey(userId)),
  });
}
