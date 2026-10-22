/**
 * POST /auth/test — test sign-in: a throwaway anonymous learner, preview deployments only.
 * POST-only so a link cannot create accounts or change the visitor's session.
 */
import { authConfig, testLoginEnabled } from "../../../lib/auth/config.ts";
import { signUpAnonymously } from "../../../lib/auth/oauth.ts";
import { sessionCookies } from "../../../lib/auth/refresh.ts";
import { meUrl, redirectWith, safeLang } from "../../../lib/auth/redirect.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const lang = safeLang(typeof form.get("lang") === "string" ? (form.get("lang") as string) : null);
  const secure = new URL(request.url).protocol === "https:";

  const cfg = authConfig();
  if (!cfg || !testLoginEnabled()) return redirectWith(meUrl(lang, "unavailable"), []);

  try {
    const tokens = await signUpAnonymously(cfg);
    return redirectWith(meUrl(lang, "signed-in"), sessionCookies(tokens, secure));
  } catch {
    return redirectWith(meUrl(lang, "failed"), []);
  }
}
