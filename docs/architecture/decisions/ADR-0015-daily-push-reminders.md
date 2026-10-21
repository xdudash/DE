# ADR-0015: Daily push reminders

Status: Accepted (owner choice in the MVP request). Setup steps: [REMINDERS_SETUP.md](../../development/REMINDERS_SETUP.md).

## Context
The owner asked for push reminders as the only notification feature in the first MVP. A reminder is useful only when it reaches the learner's own device, so subscriptions belong to an account. Reminders must never pressure or shame, and must never carry learning content.

## Decision
- **Web Push** with VAPID keys (RFC 8292) and encrypted payloads (RFC 8291), sent with the `web-push` library. Chosen over a native app because the product is a PWA (ADR-0001, ADR-0012).
- **One reminder per day**, sent by Vercel Cron at 17:00 UTC (about 18:00–19:00 Central European time). It has no per-learner time zone in this MVP; that can follow.
- **Opt-in, off by default.** A learner turns it on in their own area. Turning it on requires a signed-in account, so the subscription is stored with the account and removed with it.
- **Storage:** `push_subscriptions` (migration 0002): RLS lets the learner select, insert and delete only their own rows. Learners have no UPDATE, so `last_sent_on` belongs to the sender. The upsert on the endpoint runs with the service role after the session check and always uses the verified user id; this is needed because an endpoint can move to another learner on a shared device (ADR-0010).
- **Message text** comes from the interface catalogs in the learner's chosen language. It contains no lesson content, no counts and no streak information.
- **Failures are honest:** a gone endpoint (404/410) is forgotten; other failures are counted and logged by error name only. The endpoint and keys are never logged.
- **Cron authentication:** `Authorization: Bearer CRON_SECRET`, compared in constant time; the route refuses to run if the secret is unset or shorter than 16 characters.

## Consequences
- A push endpoint identifies a device, so it is personal data. It is covered by account deletion (cascade). DATA_AND_PRIVACY should list it; this is a follow-up.
- The `web-push` package is a new dependency. Its licence has not been verified in this sandbox (believed MPL-2.0). The owner must check it before the first release; see the setup guide.
- iOS delivers web push only to apps added to the Home Screen; the interface says so.
- At most 200 reminders go out per daily run. Larger audiences need a queue (later).
- Owner steps (VAPID keys, CRON_SECRET, Vercel environment, applying the migration) are not complete until the owner does them. Until then the interface says reminders are not set up.
