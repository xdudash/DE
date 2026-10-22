import { strict as assert } from "node:assert";
import { createHmac, generateKeyPairSync, sign as cryptoSign, type KeyObject } from "node:crypto";
import { describe, it } from "node:test";
import { CLOCK_SKEW_SECONDS, TokenInvalid, UnknownSigningKey, verifyJwt, type Jwk, type VerificationKeys } from "../lib/auth/jwt.ts";
import { sign as derSign } from "node:crypto";

const SECRET = "test-secret-not-a-real-one";
const USER = "11111111-1111-4111-8111-111111111111";
const NOW = 1_800_000_000;
const LEARNER = { sub: USER, role: "authenticated", aud: "authenticated", exp: NOW + 3600 };

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");

function hs256(payload: object, secret = SECRET, header: object = { alg: "HS256", typ: "JWT" }): string {
  const body = `${b64(header)}.${b64(payload)}`;
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
}

const ec = generateKeyPairSync("ec", { namedCurve: "P-256" });
const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = (key: KeyObject, kid: string, alg: string): Jwk => ({ ...(key.export({ format: "jwk" }) as Jwk), kid, alg, use: "sig" });
const EC_JWK = jwk(ec.publicKey, "ec-1", "ES256");
const RSA_JWK = jwk(rsa.publicKey, "rsa-1", "RS256");

function asymmetric(payload: object, alg: "ES256" | "RS256", kid: string, key: KeyObject = alg === "ES256" ? ec.privateKey : rsa.privateKey): string {
  const body = `${b64({ alg, kid, typ: "JWT" })}.${b64(payload)}`;
  const sig = alg === "ES256" ? cryptoSign("sha256", Buffer.from(body), { key, dsaEncoding: "ieee-p1363" }) : cryptoSign("sha256", Buffer.from(body), key);
  return `${body}.${sig.toString("base64url")}`;
}

const KEYS: VerificationKeys = { hs256Secret: SECRET, jwks: [EC_JWK, RSA_JWK] };
const rejects = (token: string, match: RegExp, keys: VerificationKeys = KEYS) =>
  assert.throws(() => verifyJwt(token, keys, NOW), (e: unknown) => {
    assert.ok(e instanceof TokenInvalid, `expected TokenInvalid, got ${String(e)}`);
    assert.match(e.message, match);
    return true;
  });

describe("verifyJwt: signatures", () => {
  it("accepts an ES256 token signed by the project's key (hosted Supabase projects)", () => {
    const claims = verifyJwt(asymmetric(LEARNER, "ES256", "ec-1"), { jwks: [EC_JWK] }, NOW);
    assert.equal(claims.sub, USER);
  });

  it("accepts an RS256 token", () => {
    assert.equal(verifyJwt(asymmetric(LEARNER, "RS256", "rsa-1"), KEYS, NOW).sub, USER);
  });

  it("accepts an HS256 token only when the legacy secret is configured", () => {
    assert.equal(verifyJwt(hs256(LEARNER), KEYS, NOW).sub, USER);
    rejects(hs256(LEARNER), /no shared secret/, { jwks: [EC_JWK] });
  });

  it("refuses an ES256 token signed by another key", () => {
    const other = generateKeyPairSync("ec", { namedCurve: "P-256" });
    rejects(asymmetric(LEARNER, "ES256", "ec-1", other.privateKey), /signature/);
  });

  it("reports an unknown key id so the caller can refresh the key set", () => {
    assert.throws(() => verifyJwt(asymmetric(LEARNER, "ES256", "rotated"), KEYS, NOW), UnknownSigningKey);
  });

  it("never uses a key for another algorithm (no algorithm confusion)", () => {
    rejects(asymmetric(LEARNER, "RS256", "ec-1"), /unknown signing key/);
    const ecAsRs = { ...EC_JWK, kid: "rsa-1" };
    rejects(asymmetric(LEARNER, "RS256", "rsa-1"), /unknown signing key/, { jwks: [ecAsRs] });
    // The public key's JSON is not an HMAC secret.
    rejects(hs256(LEARNER, JSON.stringify(EC_JWK)), /no shared secret/, { jwks: [EC_JWK] });
  });

  it("refuses a key that is not marked for signatures", () => {
    rejects(asymmetric(LEARNER, "ES256", "ec-1"), /unknown signing key/, { jwks: [{ ...EC_JWK, use: "enc" }] });
  });

  it("refuses a tampered payload", () => {
    const [h, , s] = asymmetric(LEARNER, "ES256", "ec-1").split(".");
    rejects(`${h}.${b64({ ...LEARNER, sub: "22222222-2222-4222-8222-222222222222" })}.${s}`, /signature/);
  });

  it("refuses unsupported algorithms, including none and lower-case names", () => {
    rejects(hs256(LEARNER, SECRET, { alg: "none", typ: "JWT" }), /unsupported algorithm/);
    rejects(hs256(LEARNER, SECRET, { alg: "hs256", typ: "JWT" }), /unsupported algorithm/);
    rejects(hs256(LEARNER, SECRET, { alg: "ES512", typ: "JWT" }), /unsupported algorithm/);
    rejects(hs256(LEARNER, SECRET, { typ: "JWT" }), /no algorithm/);
  });
});

describe("verifyJwt: claims", () => {
  it("requires an expiry and enforces it with a small skew allowance", () => {
    const { exp: _, ...noExp } = LEARNER;
    rejects(hs256(noExp), /no expiry/);
    rejects(hs256({ ...LEARNER, exp: NOW - CLOCK_SKEW_SECONDS - 1 }), /expired/);
    assert.ok(verifyJwt(hs256({ ...LEARNER, exp: NOW - 1 }), KEYS, NOW), "within skew is still accepted");
    rejects(hs256({ ...LEARNER, nbf: NOW + CLOCK_SKEW_SECONDS + 10 }), /not valid yet/);
  });

  it("requires the learner audience and role", () => {
    rejects(hs256({ ...LEARNER, aud: "other" }), /audience/);
    const { aud: _, ...noAud } = LEARNER;
    rejects(hs256(noAud), /audience/);
    assert.ok(verifyJwt(hs256({ ...LEARNER, aud: ["x", "authenticated"] }), KEYS, NOW), "an audience list may contain it");
    rejects(hs256({ ...LEARNER, role: "service_role" }), /role/);
    rejects(hs256({ ...LEARNER, role: "anon" }), /role/);
  });

  it("requires a user id as subject", () => {
    rejects(hs256({ ...LEARNER, sub: undefined }), /subject/);
    rejects(hs256({ ...LEARNER, sub: "admin" }), /subject/);
    rejects(hs256({ ...LEARNER, sub: 42 }), /subject/);
  });

  it("refuses malformed tokens", () => {
    rejects("not-a-token", /three dot-separated/);
    rejects("a.b.c", /header is not valid base64url JSON/);
    rejects(`${b64({ alg: "HS256" })}.not-json.${"x".repeat(43)}`, /signature|payload/);
  });
});

describe("verifyJwt: hardening (DG-026 security review)", () => {
  const body = (payload: object, header: object) => `${b64(header)}.${b64(payload)}`;

  it("refuses a DER-encoded or wrong-length ES256 signature", () => {
    const signed = body(LEARNER, { alg: "ES256", kid: "ec-1" });
    const der = derSign("sha256", Buffer.from(signed), ec.privateKey).toString("base64url");
    rejects(`${signed}.${der}`, /signature/);
    rejects(`${signed}.${Buffer.alloc(63).toString("base64url")}`, /signature/);
  });

  it("refuses inherited property names as algorithms", () => {
    for (const alg of ["constructor", "__proto__", "toString"]) rejects(hs256(LEARNER, SECRET, { alg }), /unsupported algorithm/);
  });

  it("requires a string key id for asymmetric tokens", () => {
    const noKid = { ...EC_JWK, kid: undefined };
    const signed = body(LEARNER, { alg: "ES256" });
    const sig = cryptoSign("sha256", Buffer.from(signed), { key: ec.privateKey, dsaEncoding: "ieee-p1363" }).toString("base64url");
    rejects(`${signed}.${sig}`, /key id/, { jwks: [noKid] });
    const numeric = body(LEARNER, { alg: "ES256", kid: 5 });
    const sig2 = cryptoSign("sha256", Buffer.from(numeric), { key: ec.privateKey, dsaEncoding: "ieee-p1363" }).toString("base64url");
    rejects(`${numeric}.${sig2}`, /key id/, { jwks: [noKid] });
  });

  it("refuses RSA keys shorter than 2048 bits", () => {
    const weak = generateKeyPairSync("rsa", { modulusLength: 1024 });
    const weakJwk = jwk(weak.publicKey, "weak", "RS256");
    rejects(asymmetric(LEARNER, "RS256", "weak", weak.privateKey), /too short/, { jwks: [weakJwk] });
  });

  it("accepts an RSA key published without alg and use", () => {
    const { alg: _a, use: _u, ...bare } = RSA_JWK;
    assert.equal(verifyJwt(asymmetric(LEARNER, "RS256", "rsa-1"), { jwks: [bare] }, NOW).sub, USER);
  });

  it("requires strict base64url segments", () => {
    rejects(`${hs256(LEARNER)}!!`, /base64url/);
    rejects(hs256(LEARNER).replace(".", ".="), /base64url/);
  });

  it("checks the issuer when one is expected", () => {
    const iss = "https://abc.supabase.co/auth/v1";
    assert.ok(verifyJwt(hs256({ ...LEARNER, iss }), KEYS, NOW, { issuer: iss }));
    assert.throws(() => verifyJwt(hs256({ ...LEARNER, iss: "https://other.supabase.co/auth/v1" }), KEYS, NOW, { issuer: iss }), /issuer/);
    assert.throws(() => verifyJwt(hs256(LEARNER), KEYS, NOW, { issuer: iss }), /issuer/);
  });

  it("accepts nbf within the skew window and refuses an audience list without the learner audience", () => {
    assert.ok(verifyJwt(hs256({ ...LEARNER, nbf: NOW + CLOCK_SKEW_SECONDS - 1 }), KEYS, NOW));
    rejects(hs256({ ...LEARNER, aud: ["anon", "service"] }), /audience/);
  });

  it("refuses a payload that is an array or null", () => {
    rejects(hs256([LEARNER] as unknown as object), /payload is not an object|subject/);
    rejects(hs256(null as unknown as object), /payload is not an object/);
  });
});
