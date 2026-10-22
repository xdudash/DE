/**
 * Resolves the learner behind a request. A browser carries its access token in the
 * HttpOnly `dg_access` cookie set by /auth/callback (ADR-0013); API clients may send it
 * as a Bearer token. A token that is present but rejected is an error, never a silent
 * downgrade to "anonymous": writes must not pretend to succeed for the wrong learner.
 */
import type { AuthConfig } from "./config.ts";
import { COOKIE, readCookie } from "./cookies.ts";
import { TokenInvalid, UnknownSigningKey, verifyJwt, type Claims } from "./jwt.ts";
import { KeysUnavailable, keySourceFor, type KeySource } from "./keys.ts";

export class AuthNotConfigured extends Error {
  constructor(message = "sign-in is not configured: this deployment cannot verify sessions") {
    super(message);
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

function algorithmOf(token: string): unknown {
  try {
    return (JSON.parse(Buffer.from(token.split(".")[0] ?? "", "base64url").toString("utf8")) as { alg?: unknown }).alg;
  } catch {
    return undefined;
  }
}

/**
 * Verifies an access token against the project's keys. HS256 tokens are checked against
 * the legacy secret without touching the network; others against the cached JWKS, with
 * one refresh when the token names a key id the cache does not have yet.
 * Throws TokenInvalid for an untrustworthy token, AuthNotConfigured when no key can check it.
 */
export async function verifyAccessToken(
  token: string,
  cfg: Pick<AuthConfig, "url" | "jwtSecret">,
  nowSeconds: number,
  source: KeySource = keySourceFor(cfg),
): Promise<Claims> {
  if (algorithmOf(token) === "HS256" && cfg.jwtSecret) {
    return verifyJwt(token, { hs256Secret: cfg.jwtSecret, jwks: [] }, nowSeconds);
  }
  try {
    try {
      return verifyJwt(token, await source.get(), nowSeconds);
    } catch (err) {
      if (!(err instanceof UnknownSigningKey)) throw err;
      return verifyJwt(token, await source.refresh(), nowSeconds);
    }
  } catch (err) {
    if (err instanceof KeysUnavailable) throw new AuthNotConfigured(err.message);
    throw err;
  }
}

/**
 * Returns the session, or null when the request carries no credentials.
 * Throws TokenInvalid when a token is present but not trustworthy, and AuthNotConfigured
 * when sign-in is not set up or the signing keys cannot be loaded.
 */
export async function sessionFrom(
  request: Request,
  cfg: Pick<AuthConfig, "url" | "jwtSecret"> | null,
  nowSeconds: number,
  source?: KeySource,
): Promise<Session | null> {
  const token = bearer(request) ?? readCookie(request, COOKIE.access);
  if (!token) return null;
  if (!cfg) throw new AuthNotConfigured();
  const claims = await verifyAccessToken(token, cfg, nowSeconds, source);
  return { userId: claims.sub, email: typeof claims.email === "string" ? claims.email : undefined };
}

export { TokenInvalid };
