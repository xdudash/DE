/**
 * GET /api/push/cron — sends today's reminder to each subscription not yet reminded today.
 * Called once a day by Vercel Cron (vercel.json). Vercel sends `Authorization: Bearer
 * CRON_SECRET`; anything else is refused. Gone endpoints are forgotten; other failures are
 * counted and never echo the endpoint or the message.
 */
import { translator } from "@deutschgo/i18n";
import { isConfigured } from "../../../../lib/data/pg.ts";
import { cronAuthorized, pushConfig } from "../../../../lib/push/config.ts";
import { listDue, markSent, removeById } from "../../../../lib/push/store.ts";
import { sendReminder } from "../../../../lib/push/send.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/** One batch per run. Subscriptions beyond it wait for the next day's run. */
const BATCH = 200;

function json(status: number, body: unknown): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function GET(request: Request): Promise<Response> {
  const cfg = pushConfig();
  const secret = process.env.CRON_SECRET;
  if (!cfg || !secret || !isConfigured()) return json(503, { error: "not_configured" });
  if (!cronAuthorized(request.headers.get("authorization"), secret)) return json(401, { error: "unauthorized" });

  const due = await listDue(BATCH);
  let sent = 0;
  let removed = 0;
  let failed = 0;
  for (const sub of due) {
    try {
      const msg = translator(sub.lang);
      const outcome = await sendReminder(cfg, sub, {
        title: msg("reminders.pushTitle"),
        body: msg("reminders.pushBody"),
        url: `/${sub.lang}`,
      });
      if (outcome === "gone") {
        await removeById(sub.id);
        removed += 1;
      } else {
        await markSent(sub.id);
        sent += 1;
      }
    } catch (err) {
      failed += 1;
      // Log the kind of failure only: no endpoint, keys or message text.
      console.error("reminder not sent:", (err as Error).name);
    }
  }
  return json(200, { due: due.length, sent, removed, failed });
}
