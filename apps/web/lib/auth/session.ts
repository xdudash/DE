/**
 * Resolves the learner behind a request. Sign-in itself is not implemented yet
 * (DG-015): until it is, no browser carries a token and every write path reports
 * "not signed in" instead of pretending to save progress.
 */
import { TokenInvalid, verifyJwt, type Claims } from "./jwt.ts";

export class AuthNotConfigured extends Error {
  constructor() {
    super("SUPABASE_JWT_SECRET is not set: this deployment cannot verify sessions");
    this.name = "AuthNotConfigured";
  }
}

export interface Session {
  userId: string;
}

function bearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  return match?.[1] ?? null;
}

/**
 * Returns the session, or null when the request carries no credentials.
 * Throws TokenInvalid when a token is present but not trustworthy — a rejected
 * token must never be downgraded to "anonymous".
 */
export function sessionFrom(request: Request, secret: string | undefined, nowSeconds: number): Session | null {
  const token = bearer(request);
  if (!token) return null;
  if (!secret) throw new AuthNotConfigured();
  const claims: Claims = verifyJwt(token, secret, nowSeconds);
  return { userId: claims.sub };
}

export { TokenInvalid };
