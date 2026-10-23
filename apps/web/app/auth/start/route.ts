/**
 * GET /auth/start?provider=google|apple&over16=1&lang=xx — begins sign-in with PKCE.
 * Refuses unless the learner ticked "16 or older" in this same request (ADR-0013).
 */
import { authConfig } from "../../../lib/auth/config.ts";
import { COOKIE, setCookie } from "../../../lib/auth/cookies.ts";
import { authorizeUrl, isProvider } from "../../../lib/auth/oauth.ts";
import { challengeFor, newVerifier } from "../../../lib/auth/pkce.ts";
import { meUrl, redirectWith, safeLang } from "../../../lib/auth/redirect.ts";
import { rateLimitStore } from "../../../lib/data/rate-limit-store.ts";
import { POLICY } from "../../../lib/rate-limit/policy.ts";
import { clientIp, guard, subjectKey } from "../../../lib/rate-limit/limit.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** The whole sign-in round trip must finish within this window. */
const WINDOW_SECONDS = 600;

export async function GET(request: Request): Promise<Response> {
  const refused = await guard(rateLimitStore(), POLICY.authStart, subjectKey(clientIp(request)));
  if (refused) return refused;
  const url = new URL(request.url);
  const lang = safeLang(url.searchParams.get("lang"));
  const secure = url.protocol === "https:";

  const cfg = authConfig();
  if (!cfg) return redirectWith(meUrl(lang, "unavailable"), []);
  if (url.searchParams.get("over16") !== "1") return redirectWith(meUrl(lang, "age"), []);
  const provider = url.searchParams.get("provider");
  if (!isProvider(provider)) return redirectWith(meUrl(lang, "provider"), []);

  const verifier = newVerifier();
  const redirectTo = `${url.origin}/auth/callback?lang=${lang}`;
  return redirectWith(authorizeUrl(cfg, provider, redirectTo, challengeFor(verifier)), [
    setCookie(COOKIE.pkce, verifier, { maxAgeSeconds: WINDOW_SECONDS, secure }),
    setCookie(COOKIE.age, "1", { maxAgeSeconds: WINDOW_SECONDS, secure }),
  ]);
}
