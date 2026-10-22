/**
 * Verifies the access tokens Supabase Auth issues, using node:crypto only (ADR-0013, DG-026).
 *
 * Supabase projects sign with an asymmetric key published as a JWKS (ES256, or RS256);
 * older projects and the local stack sign with a shared HS256 secret. Both are accepted,
 * each only with its own kind of key, so a public key can never be used as an HMAC secret.
 *
 * Why not a library: this is the whole surface we need (three algorithms, a handful of
 * claims), and a token verifier is exactly the kind of code that should be short,
 * readable and covered by tests rather than trusted.
 */
import { createHmac, createPublicKey, timingSafeEqual, verify, type JsonWebKey, type KeyObject } from "node:crypto";

export class TokenInvalid extends Error {
  constructor(reason: string) {
    super(`token rejected: ${reason}`);
    this.name = "TokenInvalid";
  }
}

/** The token names a key this server does not know yet; the caller may refresh the JWKS once. */
export class UnknownSigningKey extends TokenInvalid {
  readonly kid: string | undefined;
  constructor(kid: string | undefined) {
    super(`unknown signing key ${JSON.stringify(kid ?? null)}`);
    this.name = "UnknownSigningKey";
    this.kid = kid;
  }
}

export interface Claims {
  sub: string;
  role: string;
  exp: number;
  nbf?: number;
  [key: string]: unknown;
}

/** One public key from the project's JWKS (RFC 7517). */
export interface Jwk extends JsonWebKey {
  kid?: string;
  alg?: string;
  use?: string;
}

export interface VerificationKeys {
  /** Legacy shared secret; only HS256 tokens are checked against it. */
  hs256Secret?: string;
  /** Public keys for ES256/RS256 tokens. */
  jwks: Jwk[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-9a-f][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/** Tolerance for clock skew between the auth server and this one. */
export const CLOCK_SKEW_SECONDS = 30;
/** Audience and role of a signed-in learner's access token (anonymous test users included). */
export const LEARNER_AUDIENCE = "authenticated";

const ASYMMETRIC: Record<string, { kty: string; crv?: string }> = {
  ES256: { kty: "EC", crv: "P-256" },
  RS256: { kty: "RSA" },
};

function decodeSegment(segment: string, what: string): unknown {
  try {
    return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
  } catch {
    throw new TokenInvalid(`${what} is not valid base64url JSON`);
  }
}

function publicKeyFor(alg: string, kid: string | undefined, jwks: Jwk[]): KeyObject {
  const want = ASYMMETRIC[alg]!;
  const jwk = jwks.find(
    (k) =>
      k.kid === kid &&
      k.kty === want.kty &&
      (want.crv === undefined || k.crv === want.crv) &&
      (k.alg === undefined || k.alg === alg) &&
      (k.use === undefined || k.use === "sig"),
  );
  if (!jwk) throw new UnknownSigningKey(kid);
  try {
    return createPublicKey({ key: jwk, format: "jwk" });
  } catch {
    throw new TokenInvalid(`signing key ${JSON.stringify(kid)} is not a usable public key`);
  }
}

function checkSignature(alg: string, kid: string | undefined, signed: string, signature: Buffer, keys: VerificationKeys): void {
  if (alg === "HS256") {
    if (!keys.hs256Secret) throw new TokenInvalid("HS256 token but no shared secret is configured");
    const expected = createHmac("sha256", keys.hs256Secret).update(signed).digest();
    if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) {
      throw new TokenInvalid("signature does not match");
    }
    return;
  }
  if (!(alg in ASYMMETRIC)) throw new TokenInvalid(`unsupported algorithm ${JSON.stringify(alg)}`);
  const key = publicKeyFor(alg, kid, keys.jwks);
  // JWS ES256 signatures are the raw r‖s pair (RFC 7518 §3.4), not DER.
  const ok = alg === "ES256"
    ? signature.length === 64 && verify("sha256", Buffer.from(signed), { key, dsaEncoding: "ieee-p1363" }, signature)
    : verify("sha256", Buffer.from(signed), key, signature);
  if (!ok) throw new TokenInvalid("signature does not match");
}

function hasAudience(aud: unknown): boolean {
  return aud === LEARNER_AUDIENCE || (Array.isArray(aud) && aud.includes(LEARNER_AUDIENCE));
}

/**
 * Returns the claims of a valid learner token. `nowSeconds` is injected so tests do not
 * depend on the wall clock.
 */
export function verifyJwt(token: string, keys: VerificationKeys, nowSeconds: number): Claims {
  const parts = token.split(".");
  if (parts.length !== 3) throw new TokenInvalid("expected three dot-separated segments");
  const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];

  const header = decodeSegment(headerB64, "header") as { alg?: unknown; kid?: unknown };
  if (typeof header !== "object" || header === null || typeof header.alg !== "string") {
    throw new TokenInvalid("header has no algorithm");
  }
  const kid = typeof header.kid === "string" ? header.kid : undefined;
  checkSignature(header.alg, kid, `${headerB64}.${payloadB64}`, Buffer.from(signatureB64, "base64url"), keys);

  const claims = decodeSegment(payloadB64, "payload") as Partial<Claims> & Record<string, unknown>;
  if (typeof claims !== "object" || claims === null) throw new TokenInvalid("payload is not an object");
  if (typeof claims.sub !== "string" || !UUID.test(claims.sub)) throw new TokenInvalid("subject is not a user id");
  if (typeof claims.exp !== "number") throw new TokenInvalid("no expiry");
  if (nowSeconds > claims.exp + CLOCK_SKEW_SECONDS) throw new TokenInvalid("expired");
  if (typeof claims.nbf === "number" && nowSeconds + CLOCK_SKEW_SECONDS < claims.nbf) throw new TokenInvalid("not valid yet");
  if (!hasAudience(claims.aud)) throw new TokenInvalid("not issued for signed-in learners (audience)");
  if (claims.role !== LEARNER_AUDIENCE) throw new TokenInvalid("not a learner token (role)");
  return claims as Claims;
}
