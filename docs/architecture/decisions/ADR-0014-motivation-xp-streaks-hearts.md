# ADR-0014: Motivation layer — XP, levels, streaks, hearts, and push reminders

- Status: Accepted (owner decision, 2026-10-20); supersedes the "no streaks/XP" statements in PRODUCT_VISION.md (lines on streaks and gamification) and the streak clause of MONETIZATION.md principle 3, as noted below
- Date: 2026-10-20
- Decision owner: Project owner

## Context
The vision (`PRODUCT_VISION.md`) rejected "streaks and XP as progress" and streak pressure, and `MONETIZATION.md` forbids streak-loss pressure. On 2026-10-20 the owner asked for a full motivation scheme (XP, streaks, hearts) and push reminders for the MVP, and explicitly declined AI features for now. This ADR records that decision and its guardrails, so that the change is deliberate and reviewable rather than silent.

## Decision
1. **Evidence stays the source of truth.** XP, levels, streaks and hearts are pure functions of the attempt evidence and the current time (`packages/gamification`). They are never stored as a separate counter that could drift.
2. **XP:** 10 per correct answer, 2 per wrong answer (effort counts). **Levels:** level *n* starts at 50·(n−1)² XP.
3. **Streaks** count the learner's own calendar days with at least one answer (time zone of the device). A streak continues through a day that has no answer yet; it breaks after a full day without answers. The longest streak is kept.
4. **Hearts:** a bar of 5. A wrong answer costs one heart; one comes back every 30 minutes while below full; correct answers cost nothing.
5. **Guardrails, binding on every later change:**
   - **Hearts limit practice attempts only.** Explanations, lesson text and the knowledge map are never locked by hearts or by a streak. This keeps the MONETIZATION rule "never paywall understanding" intact.
   - **No paid recovery** of hearts or streaks in the free app. Any future offer must follow MONETIZATION.md.
   - **No loss-pressure copy.** Messages say what is available, never what is lost ("Next heart in 12 min", not "Don't lose your streak"). A missed day resets the streak without a reproach.
   - **Reminders are optional** and turned off with one tap. They say what is ready, not what the learner is failing at.
6. **Push reminders** (`docs/development/REMINDERS_SETUP.md`): opt-in, requires a signed-in account (the subscription is stored per learner under RLS), one daily message sent by a Vercel cron job. Sent with the Web Push protocol (VAPID). Delivery needs the owner's VAPID keys and the cron secret.
7. **No AI features** in this MVP. Any AI explanation feature needs its own decision (provider, cost, content rights).
8. **Device-only numbers:** XP, levels, streaks and hearts are computed from answers on this device for now, like progress. Syncing them across devices follows the server sync work, not this ADR.

## Consequences
- + The same numbers can be recomputed server-side later without a migration.
- + Guardrails make the scheme safe to tune without re-deciding the principles.
- − The owner's choice differs from the earlier vision text. The vision and monetization documents still carry the old wording until the owner decides whether to rewrite them; this ADR is the record until then.
- − Device-only numbers can differ between devices until sync exists.

## Verification
`packages/gamification/test/progress.test.ts`: level boundaries, streaks across a time-zone boundary and after a gap, hearts regeneration without losing time on reload, order independence, and a combined summary.
