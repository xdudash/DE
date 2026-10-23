/**
 * GET /api/session — who is signed in on this browser, and whether progress is stored.
 * Pages are static (offline reading, ADR-0012), so they ask this endpoint on the client
 * instead of reading cookies while rendering.
 */
import { authConfig, testLoginEnabled } from "../../../lib/auth/config.ts";
import { sessionFrom } from "../../../lib/auth/session.ts";
import { isConfigured } from "../../../lib/data/pg.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const cfg = authConfig();
  let signedIn = false;
  let email: string | undefined;
  if (cfg) {
    try {
      const session = await sessionFrom(request, cfg, Math.floor(Date.now() / 1000));
      signedIn = !!session;
      email = session?.email;
    } catch {
      // A rejected cookie is reported as signed out; the account page offers to sign in again.
      signedIn = false;
    }
  }
  return Response.json(
    { configured: !!cfg, signedIn, email, saved: signedIn && isConfigured(), testLogin: !!cfg && testLoginEnabled() },
    { headers: { "cache-control": "no-store" } },
  );
}
