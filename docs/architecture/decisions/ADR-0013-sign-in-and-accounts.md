# ADR-0013: Sign-in with Google or Apple, PKCE, and HttpOnly cookie sessions

- Status: Accepted (implemented in DG-015; the owner's provider choice is recorded below)
- Date: 2026-10-20
- Decision owner: Project owner

## Context
Learners need an account to keep answers across devices, and the product needs somewhere to say that. ADR-0002 chose Supabase for auth and data; ADR-0010 chose server-side `pg` with role switching and already verifies Supabase's HS256 access tokens in `apps/web/lib/auth/jwt.ts`. What was missing was the browser side of sign-in.

The owner chose **Google and Apple** as the providers (2026-10-20). A separate hosted Supabase project for DeutschGo, in the EU (`eu-central-1`), was authorized and created; no other project was touched.

## Options considered
| | A. Supabase JS SDK (`@supabase/ssr`) in the app | B. Hand-written PKCE flow against the hosted Auth API (chosen) | C. Our own sessions and passwords |
|---|---|---|---|
| New dependencies | Two packages with their own cookie conventions | None; `node:crypto` and `fetch` | Password storage and reset to build and secure |
| Tokens reach the browser as | Cookies set by the SDK | Only an HttpOnly cookie we set | Ours |
| Size of the auth surface we own | Small, but spread over SDK internals | Three requests, all in `lib/auth/oauth.ts`, reviewable and tested | Large |
| Google/Apple | Supported | Supported (`provider=` on the authorize endpoint) | Would need OAuth clients anyway |

## Decision
1. **Providers:** Google and Apple via Supabase Auth. No password sign-in in P2.
2. **Flow:** PKCE (RFC 7636, S256). `/auth/start` makes a 43+ character verifier, keeps it in an HttpOnly cookie for 10 minutes, and sends only its challenge to the provider. `/auth/callback` exchanges the one-time code together with that verifier at `POST /auth/v1/token?grant_type=pkce`. An intercepted code is useless without the cookie.
3. **Session:** the access token lives in an HttpOnly, SameSite=Lax, Secure (on HTTPS) cookie `dg_access`, with a lifetime equal to the token's `expires_in`. Every server check verifies its signature with `SUPABASE_JWT_SECRET`. A token that is present but rejected is an error, never "anonymous".
4. **Registration is sign-in.** The first successful sign-in creates the Supabase Auth user. Registration is therefore gated by the same 16+ assertion as before: the learner ticks "16 or older" in the same request that starts sign-in, and the callback records it (`profiles.age_confirmed`). If the assertion cannot be stored, the learner sees that and is not told it was recorded.
5. **Account deletion** calls the Auth admin API with the service-role key, which is a server-only secret. Every learner table references `auth.users` with `ON DELETE CASCADE` (migration 0001), so the data goes with the account. Deletion requires a typed confirmation and a session cookie.
6. **Cross-site requests:** every state-changing route is POST-only, and cookies are SameSite=Lax, so a request from another site carries no session and cannot sign anyone out or delete an account.
7. **Pages stay static** (ADR-0012: offline reading). The signed-in state is read by the client from `GET /api/session`, which is `no-store`. No page calls `cookies()` while rendering.
8. **Honest state:** when Supabase or the JWT secret is not configured, sign-in reports "not set up" and offers no provider button. When signed in but no database is configured, the lesson keeps saying progress is not saved.

## Consequences
- + No SDK dependency; the flow is about 200 lines and fully unit-tested (`apps/web/test/auth.test.ts`).
- + Tokens never reach JavaScript; cross-site writes are blocked by the cookie policy and the POST-only routes.
- − The access token lasts about an hour and there is no refresh yet: after that the learner signs in again. A refresh route (refresh token in its own HttpOnly cookie) is the next increment.
- − The configured redirect URLs in Supabase must list every origin that serves the app (production and previews); a missing entry fails sign-in with the provider's error.
- − Apple requires a paid Apple Developer account and a verified domain; Google requires an OAuth client. Those are owner steps (`docs/development/ACCOUNTS_SETUP.md`).

## Verification
- Unit tests: PKCE against the RFC 7636 appendix B vector; configuration rules; cookie flags; token exchange and deletion against a fake fetch; forged, expired and missing-secret sessions (`apps/web/test/auth.test.ts`).
- E2E in CI (unconfigured deployment): start refuses with `unavailable`; no provider buttons; POST-only write routes; session endpoint reports signed out.
- Test sign-in (`POST /auth/test`) creates an anonymous Supabase user. It is gated by `AUTH_TEST_LOGIN=1` and refused when `VERCEL_ENV=production`; it is for previews only, and the Supabase anonymous-sign-in switch is what keeps it off elsewhere.
- Not verifiable in CI: a real provider round trip. It is checked by hand on a configured preview before any production use.
