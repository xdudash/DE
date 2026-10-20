/**
 * Configuration for reminders, read from the environment (ADR-0015). Nothing here is
 * hard-coded: keys and secrets are set in Vercel, never in the repository.
 */
import { timingSafeEqual } from "node:crypto";

export interface PushConfig {
  /** VAPID public key (base64url). Also needed in the browser as NEXT_PUBLIC_VAPID_PUBLIC_KEY. */
  publicKey: string;
  privateKey: string;
  /** Contact for push services: a mailto: or https: URL. */
  subject: string;
}

type Env = Record<string, string | undefined>;

/** Null unless all three VAPID values are present and the subject is a contact URL. */
export function pushConfig(env: Env = process.env): PushConfig | null {
  const publicKey = env.VAPID_PUBLIC_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY;
  const subject = env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return null;
  if (!/^(mailto:|https:\/\/)\S+$/.test(subject)) return null;
  return { publicKey, privateKey, subject };
}

/**
 * Checks the cron request's Authorization header against CRON_SECRET in constant time.
 * An unset or short secret never authorises anything.
 */
export function cronAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || secret.length < 16 || !header) return false;
  const given = Buffer.from(header, "utf8");
  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
