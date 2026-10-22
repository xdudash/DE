/** POST /auth/refresh — rotates a browser session without exposing either token to JavaScript. */
import { authConfig } from "../../../lib/auth/config.ts";
import { handleRefresh } from "../../../lib/auth/refresh.ts";
import { refreshTokens } from "../../../lib/auth/oauth.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function POST(request: Request): Promise<Response> {
  return handleRefresh(request, {
    config: authConfig,
    now: () => Math.floor(Date.now() / 1000),
    refresh: refreshTokens,
  });
}
