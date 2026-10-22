import { strict as assert } from "node:assert";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import { authConfig, testLoginEnabled } from "../lib/auth/config.ts";
import { clearCookie, COOKIE, readCookie, setCookie } from "../lib/auth/cookies.ts";
import {
  AccountDeletionUnavailable,
  AuthExchangeFailed,
  authorizeUrl,
  deleteAuthUser,
  exchangeCode,
  isProvider,
  refreshTokens,
  signUpAnonymously,
} from "../lib/auth/oauth.ts";
import { challengeFor, newVerifier } from "../lib/auth/pkce.ts";
import { AuthNotConfigured, sessionFrom } from "../lib/auth/session.ts";
import { TokenInvalid } from "../lib/auth/jwt.ts";

const SECRET = "test-jwt-secret-with-enough-length-0123456789";
const USER = "123e4567-e89b-42d3-a456-426614174000";
const NOW = 1_800_000_000;

function sign(claims: Record<string, unknown>, secret = SECRET): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const sig = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

const CFG = { url: "https://abc.supabase.co", publishableKey: "sb_publishable_test", jwtSecret: SECRET };

describe("PKCE (RFC 7636)", () => {
  it("derives the S256 challenge from the RFC appendix B verifier", () => {
    assert.equal(challengeFor("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("generates long, URL-safe, distinct verifiers", () => {
    const a = newVerifier();
    const b = newVerifier();
    assert.ok(a.length >= 43, "RFC 7636 requires at least 43 characters");
    assert.match(a, /^[A-Za-z0-9_-]+$/);
    assert.notEqual(a, b);
  });
});

describe("authConfig", () => {
  it("is null when any required variable is missing (sign-in stays off)", () => {
    assert.equal(authConfig({}), null);
    assert.equal(authConfig({ SUPABASE_URL: "https://x.supabase.co", SUPABASE_PUBLISHABLE_KEY: "k" }), null);
    assert.equal(authConfig({ SUPABASE_PUBLISHABLE_KEY: "k", SUPABASE_JWT_SECRET: "s" }), null);
  });

  it("accepts HTTPS, trims a trailing slash, and keeps the service key optional", () => {
    const cfg = authConfig({
      SUPABASE_URL: "https://abc.supabase.co/",
      SUPABASE_PUBLISHABLE_KEY: "k",
      SUPABASE_JWT_SECRET: "s",
    });
    assert.equal(cfg?.url, "https://abc.supabase.co");
    assert.equal(cfg?.serviceRoleKey, undefined);
  });

  it("refuses plain HTTP to a remote host but allows the loopback address for a local stack", () => {
    const base = { SUPABASE_PUBLISHABLE_KEY: "k", SUPABASE_JWT_SECRET: "s" };
    assert.equal(authConfig({ ...base, SUPABASE_URL: "http://abc.supabase.co" }), null);
    assert.notEqual(authConfig({ ...base, SUPABASE_URL: "http://127.0.0.1:54321" }), null);
  });

  it("refuses a malformed project URL", () => {
    assert.equal(authConfig({ SUPABASE_URL: "not a url", SUPABASE_PUBLISHABLE_KEY: "k", SUPABASE_JWT_SECRET: "s" }), null);
  });
});

describe("cookies", () => {
  const request = (cookie?: string) =>
    new Request("https://example.test/", cookie === undefined ? {} : { headers: { cookie } });

  it("reads the named cookie among several and decodes it", () => {
    const r = request("a=1; dg_access=eyJ.a.b; dg_pkce=x%20y");
    assert.equal(readCookie(r, COOKIE.access), "eyJ.a.b");
    assert.equal(readCookie(r, COOKIE.pkce), "x y");
    assert.equal(readCookie(r, "missing"), null);
  });

  it("returns null when there is no cookie header or the value is badly encoded", () => {
    assert.equal(readCookie(request(), COOKIE.access), null);
    assert.equal(readCookie(request("dg_access=%E0%A4%A"), COOKIE.access), null);
  });

  it("sets HttpOnly, SameSite=Lax and a max age; Secure only over HTTPS", () => {
    const secure = setCookie("dg_access", "tok", { maxAgeSeconds: 3600, secure: true });
    assert.match(secure, /^dg_access=tok;/);
    assert.match(secure, /HttpOnly/);
    assert.match(secure, /SameSite=Lax/);
    assert.match(secure, /Max-Age=3600/);
    assert.match(secure, /Path=\//);
    assert.match(secure, /Secure/);
    assert.doesNotMatch(setCookie("dg_access", "tok", { maxAgeSeconds: 1, secure: false }), /Secure/);
  });

  it("clears a cookie with Max-Age=0", () => {
    assert.match(clearCookie("dg_access", true), /Max-Age=0/);
  });
});

describe("OAuth helpers", () => {
  it("builds an authorize URL that carries the PKCE challenge", () => {
    const url = new URL(authorizeUrl(CFG, "google", "https://app.test/auth/callback?lang=en", "CHAL"));
    assert.equal(url.origin, "https://abc.supabase.co");
    assert.equal(url.pathname, "/auth/v1/authorize");
    assert.equal(url.searchParams.get("provider"), "google");
    assert.equal(url.searchParams.get("redirect_to"), "https://app.test/auth/callback?lang=en");
    assert.equal(url.searchParams.get("code_challenge"), "CHAL");
    assert.equal(url.searchParams.get("code_challenge_method"), "s256");
  });

  it("accepts only the providers we offer", () => {
    assert.equal(isProvider("google"), true);
    assert.equal(isProvider("apple"), true);
    assert.equal(isProvider("github"), false);
    assert.equal(isProvider(null), false);
  });

  it("exchanges a code with the verifier and the publishable key", async () => {
    let seen: { url: string; init?: RequestInit } | undefined;
    const tokens = await exchangeCode(CFG, "code-1", "ver-1", async (url, init) => {
      seen = { url, init };
      return new Response(JSON.stringify({ access_token: "a.b.c", refresh_token: "r", expires_in: 900, user: { email: "l@x.test" } }), { status: 200 });
    });
    assert.equal(seen?.url, "https://abc.supabase.co/auth/v1/token?grant_type=pkce");
    assert.equal((seen?.init?.headers as Record<string, string>).apikey, "sb_publishable_test");
    assert.deepEqual(JSON.parse(String(seen?.init?.body)), { auth_code: "code-1", code_verifier: "ver-1" });
    assert.deepEqual(tokens, { accessToken: "a.b.c", refreshToken: "r", expiresIn: 900, email: "l@x.test" });
  });

  it("fails the exchange on an HTTP error and on a body without tokens", async () => {
    await assert.rejects(
      exchangeCode(CFG, "c", "v", async () => new Response("{}", { status: 400 })),
      (err: unknown) => err instanceof AuthExchangeFailed && err.status === 400,
    );
    await assert.rejects(
      exchangeCode(CFG, "c", "v", async () => new Response("{}", { status: 200 })),
      AuthExchangeFailed,
    );
  });

  it("rotates an HttpOnly refresh token into a new access and refresh token pair", async () => {
    let seen: { url: string; init?: RequestInit } | undefined;
    const tokens = await refreshTokens(CFG, "refresh-token-1", async (url, init) => {
      seen = { url, init };
      return new Response(
        JSON.stringify({ access_token: "new.access.token", refresh_token: "refresh-token-2", expires_in: 1800, user: { email: "l@x.test" } }),
        { status: 200 },
      );
    });

    assert.equal(seen?.url, "https://abc.supabase.co/auth/v1/token?grant_type=refresh_token");
    assert.deepEqual(JSON.parse(String(seen?.init?.body)), { refresh_token: "refresh-token-1" });
    assert.deepEqual(tokens, {
      accessToken: "new.access.token",
      refreshToken: "refresh-token-2",
      expiresIn: 1800,
      email: "l@x.test",
    });
  });

  it("refuses to delete an account without the service key, and never calls out", async () => {
    let called = false;
    await assert.rejects(
      deleteAuthUser(CFG, USER, async () => {
        called = true;
        return new Response(null, { status: 200 });
      }),
      AccountDeletionUnavailable,
    );
    assert.equal(called, false);
  });

  it("deletes the auth user with the service key and reports a refused delete", async () => {
    const withKey = { ...CFG, serviceRoleKey: "service-key" };
    let seen: { url: string; init?: RequestInit } | undefined;
    await deleteAuthUser(withKey, USER, async (url, init) => {
      seen = { url, init };
      return new Response(null, { status: 200 });
    });
    assert.equal(seen?.url, `https://abc.supabase.co/auth/v1/admin/users/${USER}`);
    assert.equal(seen?.init?.method, "DELETE");
    assert.equal((seen?.init?.headers as Record<string, string>).authorization, "Bearer service-key");
    await assert.rejects(
      deleteAuthUser(withKey, USER, async () => new Response(null, { status: 403 })),
      AuthExchangeFailed,
    );
  });
});

describe("sessionFrom", () => {
  const at = (headers: Record<string, string>) => new Request("https://example.test/api", { headers });
  const good = sign({ sub: USER, exp: NOW + 600, email: "l@x.test" });

  it("is null when the request carries no credentials", () => {
    assert.equal(sessionFrom(at({}), SECRET, NOW), null);
  });

  it("accepts the access-token cookie and exposes the user and email", () => {
    const s = sessionFrom(at({ cookie: `dg_access=${good}` }), SECRET, NOW);
    assert.deepEqual(s, { userId: USER, email: "l@x.test" });
  });

  it("accepts a Bearer token", () => {
    assert.equal(sessionFrom(at({ authorization: `Bearer ${good}` }), SECRET, NOW)?.userId, USER);
  });

  it("rejects a forged cookie instead of treating the request as anonymous", () => {
    const forged = sign({ sub: USER, exp: NOW + 600 }, "attacker-secret-value-0123456789abcdef");
    assert.throws(() => sessionFrom(at({ cookie: `dg_access=${forged}` }), SECRET, NOW), TokenInvalid);
  });

  it("rejects an expired cookie", () => {
    const expired = sign({ sub: USER, exp: NOW - 3600 });
    assert.throws(() => sessionFrom(at({ cookie: `dg_access=${expired}` }), SECRET, NOW), TokenInvalid);
  });

  it("reports a missing secret as not configured when a token is present", () => {
    assert.throws(() => sessionFrom(at({ cookie: `dg_access=${good}` }), undefined, NOW), AuthNotConfigured);
  });
});

describe("test sign-in gate", () => {
  it("is off unless AUTH_TEST_LOGIN=1", () => {
    assert.equal(testLoginEnabled({}), false);
    assert.equal(testLoginEnabled({ AUTH_TEST_LOGIN: "true" }), false);
    assert.equal(testLoginEnabled({ AUTH_TEST_LOGIN: "1" }), true);
  });

  it("is never on in the production deployment, even when the flag is set", () => {
    assert.equal(testLoginEnabled({ AUTH_TEST_LOGIN: "1", VERCEL_ENV: "production" }), false);
    assert.equal(testLoginEnabled({ AUTH_TEST_LOGIN: "1", VERCEL_ENV: "preview" }), true);
  });

  it("creates an anonymous account with the publishable key and returns its tokens", async () => {
    let seen: { url: string; init?: RequestInit } | undefined;
    const tokens = await signUpAnonymously(CFG, async (url, init) => {
      seen = { url, init };
      return new Response(JSON.stringify({ access_token: "a.b.c", refresh_token: "r", expires_in: 3600, user: {} }), { status: 200 });
    });
    assert.equal(seen?.url, "https://abc.supabase.co/auth/v1/signup");
    assert.equal(seen?.init?.method, "POST");
    assert.equal((seen?.init?.headers as Record<string, string>).apikey, "sb_publishable_test");
    assert.equal(tokens.accessToken, "a.b.c");
    assert.equal(tokens.email, undefined);
  });

  it("reports a refused anonymous sign-in instead of returning empty tokens", async () => {
    await assert.rejects(
      signUpAnonymously(CFG, async () => new Response("{}", { status: 422 })),
      (err: unknown) => err instanceof AuthExchangeFailed && err.status === 422,
    );
  });
});
