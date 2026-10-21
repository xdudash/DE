# Daily reminders: owner setup

Decision: [ADR-0015](../architecture/decisions/ADR-0015-daily-push-reminders.md). Until these steps are done, the reminder area says reminders are not set up. Nothing is sent without them.

**Never paste keys or secrets into chat, a commit or an issue.** Set them in Vercel only.

## 1. Check the licence of `web-push`
The app depends on `web-push` (and `@types/web-push`). Confirm its licence on npm or GitHub before the first release. It is believed to be MPL-2.0 but this has not been verified.

## 2. Generate VAPID keys (on your own computer)
```sh
npx web-push generate-vapid-keys
```
You get a public key and a private key. Keep the private key out of every repository.

## 3. Set environment variables in Vercel
Project → Settings → Environment Variables. Use Production and/or Preview as you need.

| Name | Value | Secret? |
|---|---|---|
| `VAPID_PUBLIC_KEY` | public key from step 2 | no |
| `VAPID_PRIVATE_KEY` | private key from step 2 | **yes** |
| `VAPID_SUBJECT` | a contact, such as `mailto:you@example.org` | no |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | the same value as `VAPID_PUBLIC_KEY` | no (inlined into the browser bundle at build time) |
| `CRON_SECRET` | a random string of 16+ characters, for example from `openssl rand -base64 32` | **yes** |

`NEXT_PUBLIC_VAPID_PUBLIC_KEY` is read at build time: after setting it, redeploy.

## 4. Apply the database migration
`supabase/migrations/0002_push_subscriptions.sql` creates `push_subscriptions` with row-level security. Apply it to the `deutschgo` Supabase project once you have authorised that change, in the same way as migration 0001. Check afterwards that the advisors report no new findings.

## 5. Confirm the daily cron
`vercel.json` at the repository root schedules `/api/push/cron` daily at 17:00 UTC. If the Vercel project's root directory is not the repository root, move `vercel.json` to that directory. Check under Project → Settings → Cron Jobs that the job appears.

## 6. Test once
1. Sign in on a preview deployment and open `/en/me` (or your language).
2. Turn on the daily reminder and allow notifications. On iPhone, first add DeutschGo to the Home Screen.
3. Trigger the cron once by hand:
   ```sh
   curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR-PREVIEW-ADDRESS/api/push/cron
   ```
   Expected: `{"due":1,"sent":1,"removed":0,"failed":0}` (the numbers vary). `401` means the secret does not match; `503` means a variable from step 3 is missing.

## Privacy
A push endpoint identifies the device. Turning reminders off or deleting the account removes it. The reminder text contains no learning content.
