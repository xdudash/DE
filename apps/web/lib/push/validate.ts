/**
 * Pure checks for push subscription requests. No I/O here, so the rules are tested
 * directly (apps/web/test/push.test.ts). Anything malformed is rejected before it
 * reaches the database or a push service.
 */

export interface PushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export type Parsed<T> = { ok: true; value: T } | { ok: false; reason: "invalid_body" | "invalid_endpoint" | "invalid_keys" | "invalid_lang" };

const BASE64URL = /^[A-Za-z0-9_-]+$/;
const MAX_ENDPOINT = 2048;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A push service endpoint is an HTTPS URL without credentials. */
export function validEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_ENDPOINT) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}

function validKey(value: unknown, min: number, max: number): value is string {
  return typeof value === "string" && value.length >= min && value.length <= max && BASE64URL.test(value);
}

export function parseSubscribe(
  body: unknown,
  isLang: (code: string) => boolean,
): Parsed<{ subscription: PushSubscriptionInput; lang: string }> {
  if (!isRecord(body) || !isRecord(body.subscription)) return { ok: false, reason: "invalid_body" };
  const { endpoint, keys } = body.subscription;
  if (!validEndpoint(endpoint)) return { ok: false, reason: "invalid_endpoint" };
  if (!isRecord(keys) || !validKey(keys.p256dh, 40, 200) || !validKey(keys.auth, 16, 64)) {
    return { ok: false, reason: "invalid_keys" };
  }
  const lang = typeof body.lang === "string" ? body.lang : "";
  if (!isLang(lang)) return { ok: false, reason: "invalid_lang" };
  return { ok: true, value: { subscription: { endpoint, p256dh: keys.p256dh, auth: keys.auth }, lang } };
}

export function parseUnsubscribe(body: unknown): Parsed<{ endpoint: string }> {
  if (!isRecord(body)) return { ok: false, reason: "invalid_body" };
  if (!validEndpoint(body.endpoint)) return { ok: false, reason: "invalid_endpoint" };
  return { ok: true, value: { endpoint: body.endpoint } };
}
