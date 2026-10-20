/**
 * GET /auth/callback?code=…&lang=xx — the provider's return. Exchanges the one-time code
 * with the PKCE verifier from this browser, stores the session cookie, and records the
 * learner's 16+ assertion when the sign-in began with one.
 */
import { authConfig } from "../../../lib/auth/config.ts";
import { COOKIE, clearCookie, readCookie, setCookie } from "../../../lib/auth/cookies.ts";
import { exchangeCode } from "../../../lib/auth/oauth.ts";
import { verifyJwt } from "../../../lib/auth/jwt.ts";
import { meUrl, redirectWith, safeLang, type AuthNotice } from "../../../lib/auth/redirect.ts";
import { ageGateStore } from "../../../lib/data/profile-store.ts";
import { isConfigured } from "../../../lib/data/pg.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const lang = safeLang(url.searchParams.get("lang"));
  const secure = url.protocol === "https:";
  const clears = [clearCookie(COOKIE.pkce, secure), clearCookie(COOKIE.age, secure)];

  const cfg = authConfig();
  if (!cfg) return redirectWith(meUrl(lang, "unavailable"), clears);

  const code = url.searchParams.get("code");
  const verifier = readCookie(request, COOKIE.pkce);
  if (!code || !verifier) return redirectWith(meUrl(lang, "failed"), clears);

  try {
    const tokens = await exchangeCode(cfg, code, verifier);
    const claims = verifyJwt(tokens.accessToken, cfg.jwtSecret, Math.floor(Date.now() / 1000));
    const session = setCookie(COOKIE.access, tokens.accessToken, { maxAgeSeconds: tokens.expiresIn, secure });

    let notice: AuthNotice = "signed-in";
    if (readCookie(request, COOKIE.age) === "1") {
      // Written as the new learner; without a database the assertion cannot be stored,
      // and the learner is told so rather than told it was recorded.
      const store = isConfigured() ? ageGateStore(claims.sub) : null;
      try {
        if (!store) throw new Error("no database");
        await store.confirmAge(claims.sub);
      } catch {
        notice = "age-not-recorded";
      }
    }
    return redirectWith(meUrl(lang, notice), [session, ...clears]);
  } catch {
    return redirectWith(meUrl(lang, "failed"), clears);
  }
}
