import { strict as assert } from "node:assert";
import { generateKeyPairSync, sign as cryptoSign } from "node:crypto";
import { describe, it } from "node:test";
import { KEYS_TTL_MS, KeysUnavailable, MAX_STALE_MS, REFRESH_MIN_INTERVAL_MS, issuerFor, jwksUrl, keySource } from "../lib/auth/keys.ts";
import { AuthNotConfigured, TokenInvalid, sessionFrom, verifyAccessToken } from "../lib/auth/session.ts";
import type { Jwk } from "../lib/auth/jwt.ts";

const URL_ = "https://abc.supabase.co";
const USER = "11111111-1111-4111-8111-111111111111";
const NOW = 1_800_000_000;
const LEARNER = { sub: USER, role: "authenticated", aud: "authenticated", iss: "https://abc.supabase.co/auth/v1", exp: NOW + 3600, email: "l@x.test" };

const ec = generateKeyPairSync("ec", { namedCurve: "P-256" });
const EC_JWK: Jwk = { ...(ec.publicKey.export({ format: "jwk" }) as Jwk), kid: "k1", alg: "ES256", use: "sig" };
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
function es256(payload: object, kid = "k1"): string {
  const body = `${b64({ alg: "ES256", kid, typ: "JWT" })}.${b64(payload)}`;
  return `${body}.${cryptoSign("sha256", Buffer.from(body), { key: ec.privateKey, dsaEncoding: "ieee-p1363" }).toString("base64url")}`;
}

/** A fake JWKS endpoint that counts requests; `respond` can be swapped between calls. */
function endpoint(respond: () => Response | Promise<Response> = () => Response.json({ keys: [EC_JWK] })) {
  const calls: string[] = [];
  const state = { respond };
  const fetchImpl = (async (input: string | URL | Request) => {
    calls.push(String(input));
    return state.respond();
  }) as typeof fetch;
  return { calls, state, fetchImpl };
}

describe("keySource", () => {
  it("loads the project's JWKS from Supabase Auth and caches it for the TTL", async () => {
    const ep = endpoint();
    let now = 0;
    const src = keySource({ url: URL_ }, ep.fetchImpl, () => now);
    assert.deepEqual((await src.get()).jwks, [EC_JWK]);
    await src.get();
    assert.deepEqual(ep.calls, [jwksUrl(URL_)]);
    assert.equal(jwksUrl(URL_), "https://abc.supabase.co/auth/v1/.well-known/jwks.json");
    now = KEYS_TTL_MS;
    await src.get();
    assert.equal(ep.calls.length, 2, "reloads after the TTL");
  });

  it("includes the legacy secret only when configured", async () => {
    assert.equal((await keySource({ url: URL_ }, endpoint().fetchImpl).get()).hs256Secret, undefined);
    assert.equal((await keySource({ url: URL_, jwtSecret: "s" }, endpoint().fetchImpl).get()).hs256Secret, "s");
  });

  it("limits refreshes so forged key ids cannot amplify requests", async () => {
    const ep = endpoint();
    let now = 0;
    const src = keySource({ url: URL_ }, ep.fetchImpl, () => now);
    await src.get();
    await src.refresh();
    await src.refresh();
    assert.equal(ep.calls.length, 1);
    now = REFRESH_MIN_INTERVAL_MS;
    await src.refresh();
    assert.equal(ep.calls.length, 2);
  });

  it("shares one request between concurrent callers", async () => {
    const ep = endpoint();
    const src = keySource({ url: URL_ }, ep.fetchImpl);
    await Promise.all([src.get(), src.get(), src.get()]);
    assert.equal(ep.calls.length, 1);
  });

  it("fails loudly without keys, and keeps the last good keys through an outage", async () => {
    const ep = endpoint(() => new Response("down", { status: 503 }));
    let now = 0;
    const src = keySource({ url: URL_ }, ep.fetchImpl, () => now);
    await assert.rejects(() => src.get(), KeysUnavailable);

    ep.state.respond = () => Response.json({ keys: [EC_JWK] });
    now = REFRESH_MIN_INTERVAL_MS;
    await src.get();
    ep.state.respond = () => Promise.reject(new TypeError("network"));
    now += KEYS_TTL_MS;
    assert.deepEqual((await src.get()).jwks, [EC_JWK], "stale keys still verify");
    const callsAfterOutage = ep.calls.length;
    await src.get();
    assert.equal(ep.calls.length, callsAfterOutage, "no retry on every request during an outage");
  });

  it("refuses a response without a keys array", async () => {
    await assert.rejects(() => keySource({ url: URL_ }, endpoint(() => Response.json({ nope: 1 })).fetchImpl).get(), KeysUnavailable);
    await assert.rejects(() => keySource({ url: URL_ }, endpoint(() => new Response("<html>")).fetchImpl).get(), KeysUnavailable);
  });
});

describe("verifyAccessToken and sessionFrom with a JWKS", () => {
  const at = (headers: Record<string, string>) => new Request("https://example.test/api", { headers });

  it("verifies an ES256 learner token from the cookie", async () => {
    const src = keySource({ url: URL_ }, endpoint().fetchImpl);
    const s = await sessionFrom(at({ cookie: `dg_access=${es256(LEARNER)}` }), { url: URL_ }, NOW, src);
    assert.deepEqual(s, { userId: USER, email: "l@x.test" });
  });

  it("refreshes once when the token names a newly rotated key", async () => {
    const ep = endpoint(() => Response.json({ keys: [] }));
    let now = 0;
    const src = keySource({ url: URL_ }, ep.fetchImpl, () => now);
    await src.get();
    ep.state.respond = () => Response.json({ keys: [EC_JWK] });
    now = REFRESH_MIN_INTERVAL_MS;
    assert.equal((await verifyAccessToken(es256(LEARNER), { url: URL_ }, NOW, src)).sub, USER);
    assert.equal(ep.calls.length, 2);
  });

  it("rejects a token whose key id is unknown even after a refresh", async () => {
    const src = keySource({ url: URL_ }, endpoint().fetchImpl);
    await assert.rejects(() => verifyAccessToken(es256(LEARNER, "forged"), { url: URL_ }, NOW, src), TokenInvalid);
  });

  it("reports unloadable keys as 'cannot verify', never as signed out or as valid", async () => {
    const src = keySource({ url: URL_ }, endpoint(() => new Response("down", { status: 500 })).fetchImpl);
    await assert.rejects(() => sessionFrom(at({ cookie: `dg_access=${es256(LEARNER)}` }), { url: URL_ }, NOW, src), AuthNotConfigured);
  });

  it("does not fetch keys for a request without credentials", async () => {
    const ep = endpoint();
    assert.equal(await sessionFrom(at({}), { url: URL_ }, NOW, keySource({ url: URL_ }, ep.fetchImpl)), null);
    assert.equal(ep.calls.length, 0);
  });
});

describe("keySource and verifyAccessToken: hardening (DG-026 security review)", () => {
  const down = () => new Response("down", { status: 503 });

  it("does not retry a failed first load on every request", async () => {
    const ep = endpoint(down);
    let now = 0;
    const src = keySource({ url: URL_ }, ep.fetchImpl, () => now);
    for (let i = 0; i < 5; i++) await assert.rejects(() => src.get(), KeysUnavailable);
    assert.equal(ep.calls.length, 1);
    now = REFRESH_MIN_INTERVAL_MS;
    await assert.rejects(() => src.get(), KeysUnavailable);
    assert.equal(ep.calls.length, 2);
  });

  it("stops trusting cached keys after MAX_STALE_MS of outage, so a revoked key ends", async () => {
    const ep = endpoint();
    let now = 0;
    const src = keySource({ url: URL_ }, ep.fetchImpl, () => now);
    await src.get();
    ep.state.respond = down;
    now = MAX_STALE_MS - 1;
    assert.deepEqual((await src.get()).jwks, [EC_JWK]);
    now = MAX_STALE_MS + REFRESH_MIN_INTERVAL_MS;
    await assert.rejects(() => src.get(), KeysUnavailable);
  });

  it("rejects malformed tokens and unsupported algorithms without loading keys", async () => {
    const ep = endpoint();
    const src = keySource({ url: URL_ }, ep.fetchImpl);
    for (const token of ["garbage", "a.b", `${b64({ alg: "none" })}.${b64(LEARNER)}.x`]) {
      await assert.rejects(() => verifyAccessToken(token, { url: URL_ }, NOW, src), TokenInvalid);
    }
    assert.equal(ep.calls.length, 0);
  });

  it("rejects an HS256 token when no secret is configured, without loading keys", async () => {
    const ep = endpoint();
    const head = b64({ alg: "HS256", typ: "JWT" });
    await assert.rejects(() => verifyAccessToken(`${head}.${b64(LEARNER)}.c2ln`, { url: URL_ }, NOW, keySource({ url: URL_ }, ep.fetchImpl)), TokenInvalid);
    assert.equal(ep.calls.length, 0);
  });

  it("answers 'cannot verify' when the refresh for an unknown key fails", async () => {
    const ep = endpoint(() => Response.json({ keys: [] }));
    let now = 0;
    const src = keySource({ url: URL_ }, ep.fetchImpl, () => now);
    await src.get();
    ep.state.respond = down;
    now = REFRESH_MIN_INTERVAL_MS;
    await assert.rejects(() => verifyAccessToken(es256(LEARNER), { url: URL_ }, NOW, src), AuthNotConfigured);
  });

  it("refuses a token issued by another project", async () => {
    const src = keySource({ url: URL_ }, endpoint().fetchImpl);
    await assert.rejects(() => verifyAccessToken(es256({ ...LEARNER, iss: "https://evil.supabase.co/auth/v1" }), { url: URL_ }, NOW, src), TokenInvalid);
    assert.equal(issuerFor("https://abc.supabase.co/"), "https://abc.supabase.co/auth/v1");
    assert.equal(jwksUrl("https://abc.supabase.co/some/path?x=1"), "https://abc.supabase.co/auth/v1/.well-known/jwks.json");
  });
});
