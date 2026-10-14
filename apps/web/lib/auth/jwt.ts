/**
 * Verifies the HS256 JWTs Supabase issues, using node:crypto only.
 *
 * Why not a library: this is the whole surface we need (one algorithm, three claims),
 * and a token verifier is exactly the kind of code that should be short, readable and
 * covered by tests rather than trusted. If we ever need JWKS/RS256 (e.g. a different
 * auth provider), replace this with a maintained library and keep the same signature.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export class TokenInvalid extends Error {
  constructor(reason: string) {
    super(`token rejected: ${reason}`);
    this.name = "TokenInvalid";
  }
}

export interface Claims {
  sub: string;
  role?: string;
  exp?: number;
  nbf?: number;
  [key: string]: unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-9a-f][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** Tolerance for clock skew between the auth server and this one. */
export const CLOCK_SKEW_SECONDS = 30;

function decodeSegment(segment: string, what: string): unknown {
  try {
    return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
  } catch {
    throw new TokenInvalid(`${what} is not valid base64url JSON`);
  }
}

/**
 * Returns the claims of a valid token. `nowSeconds` is injected so tests do not
 * depend on the wall clock.
 */
export function verifyJwt(token: string, secret: string, nowSeconds: number): Claims {
  if (!secret) throw new TokenInvalid("no signing secret configured");
  const parts = token.split(".");
  if (parts.length !== 3) throw new TokenInvalid("expected three dot-separated segments");
  const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];

  const header = decodeSegment(headerB64, "header") as { alg?: unknown; typ?: unknown };
  // Refusing anything but HS256 closes the classic "alg: none" and algorithm-confusion holes.
  if (header.alg !== "HS256") throw new TokenInvalid(`unsupported algorithm ${JSON.stringify(header.alg)}`);

  const expected = createHmac("sha256", secret).update(`${headerB64}.${payloadB64}`).digest();
  const actual = Buffer.from(signatureB64, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new TokenInvalid("signature does not match");
  }

  const claims = decodeSegment(payloadB64, "payload") as Claims;
  if (typeof claims !== "object" || claims === null) throw new TokenInvalid("payload is not an object");
  if (typeof claims.sub !== "string" || !UUID.test(claims.sub)) throw new TokenInvalid("subject is not a user id");
  if (typeof claims.exp === "number" && nowSeconds > claims.exp + CLOCK_SKEW_SECONDS) throw new TokenInvalid("expired");
  if (typeof claims.nbf === "number" && nowSeconds + CLOCK_SKEW_SECONDS < claims.nbf) throw new TokenInvalid("not valid yet");
  return claims;
}
