/**
 * Cookies for the browser session. Pure string handling so it can be tested without
 * Next.js. Every cookie is HttpOnly (scripts cannot read tokens), SameSite=Lax (sent on
 * the top-level return from the provider, not on cross-site subresource requests), and
 * Secure whenever the request is HTTPS.
 */
export const COOKIE = {
  /** Access token of the signed-in learner. */
  access: "dg_access",
  /** Refresh token used only by the server to rotate the access token. */
  refresh: "dg_refresh",
  /** PKCE verifier while a sign-in is in progress. */
  pkce: "dg_pkce",
  /** The learner ticked "16 or older" before choosing a provider. */
  age: "dg_age",
} as const;

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const raw = part.slice(eq + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return null;
    }
  }
  return null;
}

export interface CookieOptions {
  maxAgeSeconds: number;
  secure: boolean;
}

export function setCookie(name: string, value: string, opts: CookieOptions): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, Math.floor(opts.maxAgeSeconds))}`,
  ];
  if (opts.secure) parts.push("Secure");
  return parts.join("; ");
}

/** Expires a cookie immediately. */
export function clearCookie(name: string, secure: boolean): string {
  return setCookie(name, "", { maxAgeSeconds: 0, secure });
}
