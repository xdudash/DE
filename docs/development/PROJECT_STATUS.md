# Project Status

Last updated: 2026-10-25 (DG-024 merged as #77; Review Room follow-up on `feat/dg-048-global-review`)

## Current phase
**P2 — learner loop** (in progress). P1 content skeleton is done; its exit (gold unit human-reviewed) is still open. The web app is on `main` (last merges #46 `e99c7f9` and #52 `1ed94f3`) and deployed by Vercel from `main`. See [roadmap](./ROADMAP.md) and the [task register](./BACKLOG.md).

## Current branch result (DG-048 follow-up)
- PR #77 is merged to `main` as `25548d5`; CI passed foundation, content/type/build, PostgreSQL migration/RLS and attempt/import integration, and Playwright + axe.
- DG-024 adds authenticated `GET /api/progress`, server-re-evaluated idempotent device-history import, and shared progress across Home, Practice, lessons, the map, and You.
- Home explains the next recommended step; DACH scenario missions reuse authored reply-choice exercises and feed the same progress stream. Account progress has eligible/legacy import counts and a JSON download; full GDPR export/audit is still DG-028.
- Current branch adds a Review Room board and session over due concepts, sized daily queues, least-seen authored exercise selection, and shared answer persistence.
- Screen maps, learner paths, and Home, Practice, Mission, Progress, and Review mockups are in [GLOBAL_EXPERIENCE.md](../product/GLOBAL_EXPERIENCE.md).

## Implemented (on `main`)
- Content contract v1: JSON Schemas, strict YAML loader, semantic validator, bundle compiler, answer evaluator (single choice, word order, cloze, transform), graph utilities (`packages/content-kit`).
- Content: A1 graph mapped (DG-012): 67 concepts, 66 of them `planned`; **one** authored concept (V2) and the gold unit with 10 exercises (`needs_review`); 2 A1 routes. `npm run content:report`.
- Learning engine v1 (`packages/learning-engine`, DG-010): states, review scheduler, explainable recommendations.
- Attempt recording (`packages/attempts`, `POST /api/attempts`, DG-009): server re-evaluation, append-only events, derived caches.
- Learner-data schema (`supabase/migrations` 0001, 0002): RLS on every table, GDPR export function, cascade deletion. Hosted project `deutschgo` (EU) exists; 0001 is recorded as applied, 0002 (push subscriptions) is not recorded.
- Interface localization (`packages/i18n`, DG-014): en pivot, uk, ru, ar preview (RTL).
- Web app: start screen and plan, lesson as a guided run, knowledge map with search, practice list, learner area, delete device data, installable PWA with offline reading, phone layout with 44px targets (DG-016…DG-019).
- Sign-in code (DG-015, ADR-0013): Google/Apple via Supabase Auth with PKCE, HttpOnly cookie, 16+ confirmation, account deletion, attempts saved to the account when signed in. **Not configured**: needs the owner steps in [ACCOUNTS_SETUP.md](./ACCOUNTS_SETUP.md).
- Session refresh (DG-025, #52, ADR-0013): access and refresh tokens in separate HttpOnly cookies, rotation at app start, one retry of a rejected attempt after rotation. Needs the same owner setup as sign-in.
- Motivation (DG-020, ADR-0014/0015): signed-in XP/streak use merged account/device evidence; hearts remain device-local; daily push reminder code. **Push not configured**: [REMINDERS_SETUP.md](./REMINDERS_SETUP.md).
- Quality gates in CI: foundation check, content validation, unit tests, typecheck, build, Playwright + axe on desktop and phone, PostgreSQL migration/RLS tests and the attempt integration test.

## Checks run on 2026-10-22 (audit, local Windows, Node 22.14)
Foundation check (passes without `node_modules`; with dependencies installed it fails on third-party READMEs, DG-011), content validation (0 errors/warnings), typecheck, `npm test` (253 tests, 0 failures) and `npm run build` **passed**. `npm run test:db` and E2E were **not run here** (no PostgreSQL/Docker, no Playwright browser); they run in CI. CI status of `e99c7f9` was not verified (no `gh` CLI). Details: [audit §2](./PROJECT_AUDIT_2026-10-22.md#2-checks-run-for-this-audit).

## Known gaps that block the P2 exit
- The cross-device read/import path is now on `main`; provider credentials still need owner setup before production account sync can be exercised.
- Only `attempt` events are produced, so the review schedule never advances past one day and no concept can become `provisionally_mastered`. **Fix in review:** DG-021 / ADR-0016 (branch `feat/dg-021-review-evidence`) counts answers given while due as reviews.
- Failed attempt sends were not retried; **fix in review:** DG-022 (branch `feat/dg-022-event-identity-retry`) adds one event identity and a write-ahead outbox with retries; a send that meets an expired session refreshes it once (#52) and retries. Still no IndexedDB queue or batch sync (DG-023).
- Session refresh is merged (#52). The token verifier was HS256-only while the hosted project signs with ES256; **fix in review:** DG-026 (branch `feat/dg-026-session-verification`) verifies against the project's JWKS, and the refresh route uses the same verification as sign-in.
- No rate limiting, monitoring, analytics, backups with restore test, privacy notice or Impressum (DG-027, DG-031…DG-033, DG-030).
- Goals, time budget and region use different vocabularies in the app, the database and the content (DG-029).

## Authored but NOT human-verified
- German correctness and pedagogy of the gold unit (`review.*: pending`).
- uk/ru translations (0 of 210 localization files reviewed) and the uk/ru/ar interface strings: machine drafts.
- Rights confirmation for original content (owner).

## Not implemented (product scope, later phases)
Email sign-in; lexicon and saved vocabulary; reading, listening, writing and speaking activities; audio; placement; route personalisation; exercise types beyond the four; Arabic font; billing (free during build-out by decision).

## Accepted decisions
ADR-0001…0006, ADR-0009…0015 accepted. Proposed: ADR-0007 media, ADR-0008 billing.

## Blockers needing the owner
1. Reviewers for the gold unit (German, pedagogy, uk, ru) and rights confirmation (DG-007; audit Q5, Q10).
2. Decided under the owner's delegation (ADR-0017): sign-in, `DATABASE_URL` and push on previews only until the privacy gate passes (Q1); hearts only in practice (Q3, DG-034 in review); the spec goal set (Q4); Postgres rate limits (Q7). The owner can overturn any of them.
3. Accounts and reminders setup ([ACCOUNTS_SETUP.md](./ACCOUNTS_SETUP.md), [REMINDERS_SETUP.md](./REMINDERS_SETUP.md)). `SUPABASE_JWT_SECRET` is no longer needed (DG-026). Secrets go straight into Vercel, never into chat or the repository.
4. Product name, domain and legal entity (needed for the Impressum and privacy notice, DG-030; audit Q9).
5. Decisions Q2, Q6 and Q8 (money or providers) in [audit §7](./PROJECT_AUDIT_2026-10-22.md#7-decisions-needed-from-the-owner).

DG-011 (lockfile) is no longer owner-blocked and is **in review** (branch `chore/dg-011-reproducible-builds`): pinned Node 22.23.4, committed lockfile, CI `npm ci`, foundation check fixed. Locally on Node 22.23.4 after a clean `npm ci`: `npm run check` passed and left no tracked file changed.

## Production link
The permanent link is the production deployment of `main` on Vercel (ADR-0005). The address is not recorded here; read it in the Vercel dashboard (project `de` → Domains) and record it once the owner confirms it. A custom domain is an owner decision (blocker 4).

## Next recommended task
Review and merge the Review Room branch after its implementation checks. Then continue with DG-028's complete export/audit path, DG-029 profile sync after Q4, and the remaining privacy/operations gates.
