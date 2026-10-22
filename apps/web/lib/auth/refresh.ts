/**
 * Server-side refresh endpoint logic. The refresh token never leaves its HttpOnly
 * cookie: this function exchanges it directly with Supabase and rotates both cookies.
 */
import type { AuthConfig } from "./config.ts";
import { COOKIE, clearCookie, readCookie, setCookie } from "./cookies.ts";
import { verifyJwt } from "./jwt.ts";
import { type Tokens } from "./oauth.ts";

/** Refresh tokens are renewed on every successful exchange and kept for 30 days. */
export const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface RefreshDeps {
  config(): AuthConfig | null;
  now(): number;
  refresh(config: AuthConfig, refreshToken: string): Promise<Tokens>;
}

/** The two browser cookies that represent one Supabase session. */
export function sessionCookies(tokens: Tokens, secure: boolean): string[] {
  return [
    setCookie(COOKIE.access, tokens.accessToken, { maxAgeSeconds: tokens.expiresIn, secure }),
    setCookie(COOKIE.refresh, tokens.refreshToken, { maxAgeSeconds: REFRESH_MAX_AGE_SECONDS, secure }),
  ];
}

function response(status: number, secure: boolean, clear = false): Response {
  const headers = new Headers({ "cache-control": "no-store" });
  if (clear) {
    headers.append("set-cookie", clearCookie(COOKIE.access, secure));
    headers.append("set-cookie", clearCookie(COOKIE.refresh, secure));
  }
  return new Response(null, { status, headers });
}

export async function handleRefresh(request: Request, deps: RefreshDeps): Promise<Response> {
  const secure = new URL(request.url).protocol === "https:";
  if (request.method !== "POST") return response(405, secure);

  const cfg = deps.config();
  if (!cfg) return response(503, secure);
  const refreshToken = readCookie(request, COOKIE.refresh);
  if (!refreshToken) return response(401, secure, true);

  try {
    const tokens = await deps.refresh(cfg, refreshToken);
    verifyJwt(tokens.accessToken, cfg.jwtSecret, deps.now());
    const headers = new Headers({ "cache-control": "no-store" });
    for (const cookie of sessionCookies(tokens, secure)) headers.append("set-cookie", cookie);
    return new Response(null, { status: 204, headers });
  } catch {
    return response(401, secure, true);
  }
}
