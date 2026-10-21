/**
 * POST /auth/delete — deletes the signed-in account and, through ON DELETE CASCADE, every
 * learner row. Requires the typed-in confirmation field and a session cookie; a cross-site
 * request carries no SameSite=Lax cookie, so it cannot delete anything.
 */
import { authConfig } from "../../../lib/auth/config.ts";
import { COOKIE, clearCookie } from "../../../lib/auth/cookies.ts";
import { AccountDeletionUnavailable, deleteAuthUser } from "../../../lib/auth/oauth.ts";
import { sessionFrom } from "../../../lib/auth/session.ts";
import { meUrl, redirectWith, safeLang } from "../../../lib/auth/redirect.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const lang = safeLang(typeof form.get("lang") === "string" ? (form.get("lang") as string) : null);
  const secure = new URL(request.url).protocol === "https:";

  const cfg = authConfig();
  if (!cfg) return redirectWith(meUrl(lang, "unavailable"), []);

  let session: ReturnType<typeof sessionFrom> = null;
  try {
    session = sessionFrom(request, cfg.jwtSecret, Math.floor(Date.now() / 1000));
  } catch {
    session = null;
  }
  if (!session) return redirectWith(meUrl(lang, "failed"), [clearCookie(COOKIE.access, secure)]);
  if (form.get("confirm") !== "delete") return redirectWith(meUrl(lang, "confirm"), []);

  try {
    await deleteAuthUser(cfg, session.userId);
  } catch (err) {
    if (err instanceof AccountDeletionUnavailable) return redirectWith(meUrl(lang, "delete-unavailable"), []);
    return redirectWith(meUrl(lang, "failed"), []);
  }
  return redirectWith(meUrl(lang, "deleted"), [clearCookie(COOKIE.access, secure)]);
}
