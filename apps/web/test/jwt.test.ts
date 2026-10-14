import { strict as assert } from "node:assert";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import { CLOCK_SKEW_SECONDS, TokenInvalid, verifyJwt } from "../lib/auth/jwt.ts";

const SECRET = "test-secret-not-a-real-one";
const USER = "11111111-1111-4111-8111-111111111111";
const NOW = 1_800_000_000;

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
function sign(payload: object, secret = SECRET, header: object = { alg: "HS256", typ: "JWT" }): string {
  const body = `${b64(header)}.${b64(payload)}`;
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
}
const rejects = (token: string, match: RegExp, secret = SECRET) =>
  assert.throws(() => verifyJwt(token, secret, NOW), (e: unknown) => {
    assert.ok(e instanceof TokenInvalid, `expected TokenInvalid, got ${String(e)}`);
    assert.match(e.message, match);
    return true;
  });

describe("verifyJwt", () => {
  it("accepts a correctly signed, unexpired token", () => {
    const claims = verifyJwt(sign({ sub: USER, role: "authenticated", exp: NOW + 3600 }), SECRET, NOW);
    assert.equal(claims.sub, USER);
    assert.equal(claims.role, "authenticated");
  });

  it("refuses a token signed with another secret", () => {
    rejects(sign({ sub: USER }, "other-secret"), /signature/);
  });

  it("refuses a tampered payload", () => {
    const token = sign({ sub: USER, role: "authenticated" });
    const [h, , s] = token.split(".");
    rejects(`${h}.${b64({ sub: "22222222-2222-4222-8222-222222222222", role: "service_role" })}.${s}`, /signature/);
  });

  it("refuses algorithms other than HS256, including none", () => {
    rejects(sign({ sub: USER }, SECRET, { alg: "none", typ: "JWT" }), /unsupported algorithm/);
    rejects(sign({ sub: USER }, SECRET, { alg: "RS256", typ: "JWT" }), /unsupported algorithm/);
    rejects(sign({ sub: USER }, SECRET, { alg: "hs256", typ: "JWT" }), /unsupported algorithm/);
  });

  it("enforces expiry and not-before, with a small skew allowance", () => {
    rejects(sign({ sub: USER, exp: NOW - CLOCK_SKEW_SECONDS - 1 }), /expired/);
    assert.ok(verifyJwt(sign({ sub: USER, exp: NOW - 1 }), SECRET, NOW), "within skew is still accepted");
    rejects(sign({ sub: USER, nbf: NOW + CLOCK_SKEW_SECONDS + 10 }), /not valid yet/);
  });

  it("requires a user id as subject", () => {
    rejects(sign({ role: "authenticated" }), /subject/);
    rejects(sign({ sub: "admin" }), /subject/);
    rejects(sign({ sub: 42 }), /subject/);
  });

  it("refuses malformed tokens and a missing secret", () => {
    rejects("not-a-token", /three dot-separated/);
    rejects("a.b.c", /header is not valid base64url JSON/);
    rejects(`${b64({ alg: "HS256" })}.not-json.${"x".repeat(43)}`, /signature|payload/);
    rejects(sign({ sub: USER }), /no signing secret/, "");
  });
});
