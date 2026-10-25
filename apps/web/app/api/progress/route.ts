/** GET /api/progress — account learning events, always scoped by the verified learner. */
import { attemptStore } from "../../../lib/data/attempt-store.ts";
import { isConfigured } from "../../../lib/data/pg.ts";
import { authConfig } from "../../../lib/auth/config.ts";
import { sessionFrom } from "../../../lib/auth/session.ts";
import { bundle } from "../../../lib/content.ts";
import { handleGetProgress } from "../../../lib/progress/handler.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(request: Request): Promise<Response> {
  return handleGetProgress(request, {
    bundle,
    storeFor: (userId) => (isConfigured() ? attemptStore(userId) : null),
    session: (req) => sessionFrom(req, authConfig(), Math.floor(Date.now() / 1000)),
    now: () => Date.now(),
  });
}
