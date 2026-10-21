/**
 * Storage for reminder subscriptions. The learner adds and removes their own rows
 * through the learner context (RLS decides). Saving uses the service role only for the
 * upsert, because an endpoint may move to another learner on a shared device, which
 * the learner context cannot do (no UPDATE policy). The user id is always the one the
 * verified session gave us, never one from the request body.
 */
import "server-only";
import { withLearner, withService } from "../data/pg.ts";
import type { PushSubscriptionInput } from "./validate.ts";

export interface DueSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  lang: string;
}

export async function saveSubscription(userId: string, sub: PushSubscriptionInput, lang: string): Promise<void> {
  await withService((c) =>
    c.query(
      `insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, ui_lang)
         values ($1, $2, $3, $4, $5)
       on conflict (endpoint) do update
         set user_id = excluded.user_id,
             p256dh = excluded.p256dh,
             auth = excluded.auth,
             ui_lang = excluded.ui_lang,
             last_sent_on = null`,
      [userId, sub.endpoint, sub.p256dh, sub.auth, lang],
    ),
  );
}

export async function removeSubscription(userId: string, endpoint: string): Promise<void> {
  await withLearner(userId, (c) => c.query("delete from public.push_subscriptions where endpoint = $1", [endpoint]));
}

/** Subscriptions not yet sent today (UTC day, the database clock), oldest first. */
export async function listDue(limit: number): Promise<DueSubscription[]> {
  const result = await withService((c) =>
    c.query<{ id: string; endpoint: string; p256dh: string; auth: string; ui_lang: string }>(
      `select id, endpoint, p256dh, auth, ui_lang
         from public.push_subscriptions
        where last_sent_on is distinct from current_date
        order by created_at
        limit $1`,
      [limit],
    ),
  );
  return result.rows.map((r) => ({ id: r.id, endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth, lang: r.ui_lang }));
}

export async function markSent(id: string): Promise<void> {
  await withService((c) => c.query("update public.push_subscriptions set last_sent_on = current_date where id = $1", [id]));
}

export async function removeById(id: string): Promise<void> {
  await withService((c) => c.query("delete from public.push_subscriptions where id = $1", [id]));
}
