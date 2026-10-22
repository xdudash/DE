/**
 * POST /api/push/subscribe — stores this browser's push subscription for the signed-in
 * learner. DELETE removes it. Thin adapter: validation is in lib/push/validate.ts.
 * Reminders belong to an account, so an unsigned request is refused (401), never stored.
 */
import { isConfigured } from "../../../../lib/data/pg.ts";
import { authConfig } from "../../../../lib/auth/config.ts";
import { AuthNotConfigured, sessionFrom } from "../../../../lib/auth/session.ts";
import { pushConfig } from "../../../../lib/push/config.ts";
import { removeSubscription, saveSubscription } from "../../../../lib/push/store.ts";
import { parseSubscribe, parseUnsubscribe } from "../../../../lib/push/validate.ts";
import { isRoutableLocale } from "../../../../lib/i18n.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(status: number, body: unknown): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

/** The learner behind the request, or the response that says why there is none. */
async function learnerOrResponse(request: Request): Promise<{ userId: string } | Response> {
  if (!pushConfig() || !isConfigured()) return json(503, { error: "not_configured" });
  try {
    const session = await sessionFrom(request, authConfig(), Math.floor(Date.now() / 1000));
    if (!session) return json(401, { error: "signed_out" });
    return { userId: session.userId };
  } catch (err) {
    if (err instanceof AuthNotConfigured) return json(503, { error: "cannot_verify" });
    return json(401, { error: "invalid_session" });
  }
}

async function readBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export async function POST(request: Request): Promise<Response> {
  const who = await learnerOrResponse(request);
  if (who instanceof Response) return who;
  const parsed = parseSubscribe(await readBody(request), isRoutableLocale);
  if (!parsed.ok) return json(400, { error: parsed.reason });
  try {
    await saveSubscription(who.userId, parsed.value.subscription, parsed.value.lang);
  } catch {
    return json(500, { error: "save_failed" });
  }
  return json(200, { saved: true });
}

export async function DELETE(request: Request): Promise<Response> {
  const who = await learnerOrResponse(request);
  if (who instanceof Response) return who;
  const parsed = parseUnsubscribe(await readBody(request));
  if (!parsed.ok) return json(400, { error: parsed.reason });
  try {
    await removeSubscription(who.userId, parsed.value.endpoint);
  } catch {
    return json(500, { error: "remove_failed" });
  }
  return json(200, { removed: true });
}
