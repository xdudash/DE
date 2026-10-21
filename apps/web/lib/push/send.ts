/**
 * Sends one reminder through the browser's push service with VAPID (RFC 8292) and the
 * message encryption of RFC 8291, done by the web-push library. Gone endpoints (404/410)
 * are reported so the caller can forget them; every other failure is raised.
 */
import "server-only";
import * as webpush from "web-push";
import type { PushConfig } from "./config.ts";

export interface ReminderMessage {
  title: string;
  body: string;
  /** Same-origin path the notification opens. */
  url: string;
}

export async function sendReminder(
  cfg: PushConfig,
  sub: { endpoint: string; p256dh: string; auth: string },
  message: ReminderMessage,
): Promise<"sent" | "gone"> {
  webpush.setVapidDetails(cfg.subject, cfg.publicKey, cfg.privateKey);
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(message),
      { TTL: 12 * 60 * 60, urgency: "normal" },
    );
    return "sent";
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return "gone";
    throw err;
  }
}
