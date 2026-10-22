import { strict as assert } from "node:assert";
import { createHmac } from "node:crypto";
import { it } from "node:test";
import { handleRefresh, sessionCookies } from "../lib/auth/refresh.ts";

const SECRET = "test-jwt-secret-with-enough-length-0123456789";
const USER = "123e4567-e89b-42d3-a456-426614174000";
const CFG = { url: "https://abc.supabase.co", publishableKey: "sb_publishable_test", jwtSecret: SECRET };

/** The claims Supabase puts in a signed-in learner's access token (checked since DG-026). */
const LEARNER = { aud: "authenticated", role: "authenticated", iss: "https://abc.supabase.co/auth/v1" };

function sign(claims: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", SECRET).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

it("rotates both session cookies without exposing tokens in the refresh response", async () => {
  const request = new Request("https://app.test/auth/refresh", {
    method: "POST",
    headers: { cookie: "dg_refresh=refresh-token-1" },
  });
  const response = await handleRefresh(request, {
    config: () => CFG,
    now: () => 1_800_000_000,
    refresh: async () => ({
      accessToken: sign({ ...LEARNER, sub: USER, exp: 1_800_003_600, email: "learner@example.test" }),
      refreshToken: "refresh-token-2",
      expiresIn: 3600,
      email: "learner@example.test",
    }),
  });

  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
  const cookies = response.headers.getSetCookie();
  assert.equal(cookies.length, 2);
  assert.match(cookies[0]!, /^dg_access=/);
  assert.match(cookies[1]!, /^dg_refresh=refresh-token-2;/);
  for (const cookie of cookies) {
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    assert.match(cookie, /Secure/);
  }
});

it("keeps the refresh token after its short-lived access token expires", () => {
  const cookies = sessionCookies(
    { accessToken: "access-1", refreshToken: "refresh-1", expiresIn: 900 },
    true,
  );

  assert.equal(cookies.length, 2);
  assert.match(cookies[0]!, /dg_access=access-1/);
  assert.match(cookies[0]!, /Max-Age=900/);
  assert.match(cookies[1]!, /dg_refresh=refresh-1/);
  assert.match(cookies[1]!, /Max-Age=2592000/);
});

it("forgets both cookies when Supabase rejects a refresh token", async () => {
  const response = await handleRefresh(
    new Request("https://app.test/auth/refresh", { method: "POST", headers: { cookie: "dg_refresh=expired-token" } }),
    {
      config: () => CFG,
      now: () => 1_800_000_000,
      refresh: async () => { throw new Error("invalid refresh token"); },
    },
  );

  assert.equal(response.status, 401);
  assert.deepEqual(
    response.headers.getSetCookie().map((cookie) => cookie.slice(0, cookie.indexOf(";"))),
    ["dg_access=", "dg_refresh="],
  );
  for (const cookie of response.headers.getSetCookie()) assert.match(cookie, /Max-Age=0/);
});

it("does not extend a session when the rotated token fails the sign-in checks", async () => {
  // A token without the learner audience passes a bare signature check; since DG-026 the
  // refresh path verifies exactly like sign-in, so this ends the session instead.
  for (const claims of [
    { sub: USER, exp: 1_800_003_600 },
    { ...LEARNER, aud: "anon", sub: USER, exp: 1_800_003_600 },
    { ...LEARNER, iss: "https://other.supabase.co/auth/v1", sub: USER, exp: 1_800_003_600 },
    { ...LEARNER, sub: USER, exp: 1_799_999_000 },
  ]) {
    const response = await handleRefresh(
      new Request("https://app.test/auth/refresh", { method: "POST", headers: { cookie: "dg_refresh=refresh-token-1" } }),
      {
        config: () => CFG,
        now: () => 1_800_000_000,
        refresh: async () => ({ accessToken: sign(claims), refreshToken: "refresh-token-2", expiresIn: 3600, email: "" }),
      },
    );
    assert.equal(response.status, 401, JSON.stringify(claims));
    const cookies = response.headers.getSetCookie();
    assert.equal(cookies.length, 2, "both cookies are cleared");
    for (const cookie of cookies) assert.match(cookie, /Max-Age=0/);
  }
});
