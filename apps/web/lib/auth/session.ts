/**
 * Resolves the learner behind a request. A browser carries its access token in the
 * HttpOnly `dg_access` cookie set by /auth/callback (ADR-0013); API clients may send it
 * as a Bearer token. A token that is present but rejected is an error, never a silent
 * downgrade to "anonymous": writes must not pretend to succeed for the wrong learner.
 */
import { TokenInvalid, verifyJwt, type Claims } from "./jwt.ts";
import { COOKIE, readCookie } from "./cookies.ts";

export class AuthNotConfigured extends Error {
  constructor() {
    super("SUPABASE_JWT_SECRET is not set: this deployment cannot verify sessions");
    this.name = "AuthNotConfigured";
  }
}

export interface Session {
  userId: string;
  email?: string;
}

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  return match?.[1] ?? null;
}

/**
 * Returns the session, or null when the request carries no credentials.
 * Throws TokenInvalid when a token is present but not trustworthy.
 */
export function sessionFrom(request: Request, secret: string | undefined, nowSeconds: number): Session | null {
  const token = bearer(request) ?? readCookie(request, COOKIE.access);
  if (!token) return null;
  if (!secret) throw new AuthNotConfigured();
  const claims: Claims = verifyJwt(token, secret, nowSeconds);
  return { userId: claims.sub, email: typeof claims.email === "string" ? claims.email : undefined };
}

export { TokenInvalid };
