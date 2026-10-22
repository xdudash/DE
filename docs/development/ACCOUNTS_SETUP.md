# Accounts setup — what the owner does, and how to check it

Sign-in is built (ADR-0013) but stays off until these steps are done. The code reports
"not set up" in the meantime, so nothing breaks. Never paste a secret into a chat, a
commit or a document: put it straight into Vercel's environment variables.

## 0. Already done (by the delivery agent, 2026-10-20)
- Hosted Supabase project **`deutschgo`**, project ref `tfvdeleagvklolfvcvcx`, region EU (`eu-central-1`), organization "xdudash's Org". It is separate from the other project in that organization (`shine-time-operations`), which was not touched.
- Migration `0001_init_learner_data` applied: seven tables, row-level security on each, no advisor findings.

## 1. Google (provider)
1. Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID** (Web application).
2. Authorized redirect URI: `https://tfvdeleagvklolfvcvcx.supabase.co/auth/v1/callback`
3. Copy the client ID and secret into Supabase: **Authentication → Sign In / Providers → Google**, enable it.

## 2. Apple (provider)
Requires a paid Apple Developer account.
1. Create an **App ID** with "Sign in with Apple", then a **Services ID** (its identifier is the client ID) with the Supabase callback URL above as its return URL, and a verified domain.
2. Create a **Sign in with Apple key** (`.p8`), note its key ID and your team ID.
3. In Supabase: **Authentication → Providers → Apple**, enable it and fill in the Services ID, team ID, key ID and the private key. Apple's client secret expires (at most six months); it must be rotated.

## 3. Redirect URLs (Supabase)
**Authentication → URL Configuration**:
- Site URL: the production address (once it is confirmed).
- Redirect URLs, one per origin that serves the app:
  - `https://<production-host>/auth/callback`
  - `https://*-alexs-projects-694883d9.vercel.app/auth/callback` (previews)

A missing entry makes the provider sign-in fail after the consent screen.

## 4. Vercel environment variables
Set them for **Production** and **Preview** in project `de` (Settings → Environment Variables), then redeploy.

| Name | Value | Secret? |
|---|---|---|
| `SUPABASE_URL` | `https://tfvdeleagvklolfvcvcx.supabase.co` | no |
| `SUPABASE_PUBLISHABLE_KEY` | the publishable key from the Supabase dashboard (API settings) | public, but keep it in Vercel |
| `SUPABASE_JWT_SECRET` | only for a project that still signs with the legacy HS256 secret; `deutschgo` uses an ES256 signing key, verified through its public JWKS, so leave it unset (DG-026) | no |
| `SUPABASE_SERVICE_ROLE_KEY` | the service-role key (API settings) | **yes** |
| `DATABASE_URL` | a Postgres connection string for the project, from the Supabase "Connect" panel | **yes** |

`DATABASE_URL` must connect as a role that may `set role authenticated` and `set role service_role` (ADR-0010). Learner data is stored only when it is set; without it, sign-in works but the lesson keeps saying progress is not saved.

## 4a. Test sign-in (until Google and Apple are set up)
A "test sign-in" button creates a throwaway anonymous account, so you can try the account area without a provider. It is **preview-only**: it is refused on the production deployment even if the variable is set.
1. Supabase: **Authentication → Sign In / Providers → Allow anonymous sign-ins**: enable it.
2. Vercel: add `AUTH_TEST_LOGIN` = `1` for **Preview** only (not Production), then redeploy the preview.
3. Each press creates a new account. Those accounts are not real learners; delete them from the Supabase Authentication page when you are done.

## 5. Check it on a preview (by hand)
1. Open `/en/me`, tick "I am 16 or older", choose Google. You return signed in, and the page says so.
2. Open a lesson and answer an exercise. The lesson shows "Your answers are saved to your account." (only when `DATABASE_URL` is set).
3. Sign out. The notice confirms it. Sign in again with the same account and the answers are still there.
4. Delete the account (tick the box, then "Delete my account"). The account is gone and the browser is signed out.

## Known limits (next increments)
- The session lasts about one hour; there is no refresh yet, so you sign in again after that.
- Email sign-in is not offered (Google and Apple only).
- Apple may hide the learner's email behind a relay address; the app does not need the email.
