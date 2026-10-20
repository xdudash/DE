import { test } from "node:test";
import assert from "node:assert/strict";
import { cronAuthorized, pushConfig } from "../lib/push/config.ts";
import { parseSubscribe, parseUnsubscribe, validEndpoint } from "../lib/push/validate.ts";
import { looksLikeVapidPublicKey } from "../lib/push/vapid.ts";

const KEY = "B".repeat(87);
const AUTH = "a".repeat(22);
const ok = (lang = "uk") => ({
  subscription: { endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys: { p256dh: KEY, auth: AUTH } },
  lang,
});
const knownLang = (code: string) => ["en", "uk", "ru", "ar"].includes(code);

test("a well-formed subscription is accepted with its language", () => {
  const parsed = parseSubscribe(ok("ru"), knownLang);
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.lang, "ru");
    assert.equal(parsed.value.subscription.p256dh, KEY);
  }
});

test("bodies that are not objects are refused as invalid_body", () => {
  for (const body of [null, undefined, "x", 3, [], { lang: "en" }]) {
    assert.deepEqual(parseSubscribe(body, knownLang), { ok: false, reason: "invalid_body" });
  }
});

test("only HTTPS endpoints without credentials are accepted", () => {
  const bad = [
    "http://push.example.test/x",
    "javascript:alert(1)",
    "https://user:pass@push.example.test/x",
    "not a url",
    "",
    `https://push.example.test/${"x".repeat(2100)}`,
  ];
  for (const endpoint of bad) {
    assert.equal(validEndpoint(endpoint), false, endpoint);
    assert.deepEqual(parseSubscribe({ ...ok(), subscription: { endpoint, keys: { p256dh: KEY, auth: AUTH } } }, knownLang), {
      ok: false,
      reason: "invalid_endpoint",
    });
  }
});

test("keys must be base64url of plausible length", () => {
  const cases = [
    { p256dh: "short", auth: AUTH },
    { p256dh: KEY, auth: "a+b/c=" + "a".repeat(16) }, // standard base64, not base64url
    { p256dh: KEY, auth: "a".repeat(5) },
    { p256dh: undefined, auth: AUTH },
  ];
  for (const keys of cases) {
    const body = { ...ok(), subscription: { endpoint: "https://push.example.test/a", keys } };
    assert.deepEqual(parseSubscribe(body, knownLang), { ok: false, reason: "invalid_keys" });
  }
});

test("an unknown or missing language is refused, so reminders never use an unrouted locale", () => {
  assert.deepEqual(parseSubscribe(ok("de"), knownLang), { ok: false, reason: "invalid_lang" });
  assert.deepEqual(parseSubscribe({ ...ok(), lang: undefined }, knownLang), { ok: false, reason: "invalid_lang" });
});

test("unsubscribe needs a valid endpoint only", () => {
  assert.equal(parseUnsubscribe({ endpoint: "https://push.example.test/a" }).ok, true);
  assert.deepEqual(parseUnsubscribe({ endpoint: "http://insecure.example.test" }), { ok: false, reason: "invalid_endpoint" });
  assert.deepEqual(parseUnsubscribe(null), { ok: false, reason: "invalid_body" });
});

test("reminders stay off unless all three VAPID values are present and the subject is a contact", () => {
  const full = { VAPID_PUBLIC_KEY: KEY, VAPID_PRIVATE_KEY: "p", VAPID_SUBJECT: "mailto:owner@example.test" };
  assert.deepEqual(pushConfig(full), { publicKey: KEY, privateKey: "p", subject: "mailto:owner@example.test" });
  assert.equal(pushConfig({ ...full, VAPID_PRIVATE_KEY: undefined }), null);
  assert.equal(pushConfig({ ...full, VAPID_SUBJECT: "owner@example.test" }), null);
  assert.equal(pushConfig({ ...full, VAPID_SUBJECT: "javascript:x" }), null);
  assert.equal(pushConfig({}), null);
});

test("the cron route accepts only the exact bearer secret, and never an unset one", () => {
  const secret = "s".repeat(24);
  assert.equal(cronAuthorized(`Bearer ${secret}`, secret), true);
  assert.equal(cronAuthorized(`Bearer ${"s".repeat(23)}x`, secret), false);
  assert.equal(cronAuthorized(`Bearer ${secret}x`, secret), false);
  assert.equal(cronAuthorized(secret, secret), false, "scheme is required");
  assert.equal(cronAuthorized(null, secret), false);
  assert.equal(cronAuthorized(`Bearer ${secret}`, undefined), false);
  assert.equal(cronAuthorized("Bearer ", undefined), false);
  assert.equal(cronAuthorized("Bearer short", "short"), false, "short secrets are refused outright");
});

test("the browser key check accepts a P-256 point and rejects other lengths", () => {
  assert.equal(looksLikeVapidPublicKey(KEY), true);
  assert.equal(looksLikeVapidPublicKey("B".repeat(86)), false);
  assert.equal(looksLikeVapidPublicKey(KEY + "="), false);
});
