# Project audit DG-AUDIT-001 (2026-10-22)

Scope: the whole repository at `main` = `e99c7f9` (PR #46), compared with the product, domain, architecture and quality documents. This is an audit: no application code, schema or content was changed. The resulting plan lives in [ROADMAP](./ROADMAP.md) (phase order and gates) and [BACKLOG](./BACKLOG.md) (task register); current facts in [PROJECT_STATUS](./PROJECT_STATUS.md).

Status words used below: **Done** = implemented and verified by a check that ran · **Partial** = some of the requirement exists · **Described** = in the docs, not in code · **Missing** = in neither, but the product needs it · **Blocked** = waits for an owner action · **Verify** = cannot be confirmed from the repository.

## 1. Summary

DeutschGo has a strong engineering foundation and almost no learnable product yet.

- **Strong:** a strict content contract with schemas, validator, compiler and a shared evaluator; a pure, tested learning engine; server-side re-evaluation of attempts with append-only evidence; RLS-first learner schema with structural policy tests; typed UI catalogs with RTL; a polished, accessible, installable PWA shell. 253 unit/integration tests pass; content validation, typecheck and the production build pass (section 2).
- **Thin:** there is **one** lesson (`unit.syntax.v2_declarative.a1`), and it is **not human-reviewed**; 66 of 67 A1 concepts are `planned` placeholders; 0 of 210 localization files are reviewed. No reading, listening, writing, speaking, vocabulary, placement or audio exists.
- **Not closed end to end:** the learner loop writes to the server but never reads back. Progress, states, XP, streak and hearts are computed from `localStorage` only, so "continue on another device" does not work even with an account. Only `attempt` events are ever produced, so the review scheduler can never advance past its first 1-day step and the `provisionally_mastered` state is unreachable in the real app (section 5, finding E1).
- **Not ready for real learner data:** sign-in, the database and push are built but switched off by missing configuration. Turning them on in production today would collect learner data before the privacy gate (no privacy notice or Impressum, no monitoring, no tested backups, no rate limiting, export not exposed).
- **Docs drifted:** PROJECT_STATUS and BACKLOG still list DG-015, DG-019 and DG-020 as "in review" although they were merged in #43 and #46; several documents disagree about whether a hosted database exists (section 4). This audit corrects those facts.

The critical path to the first closed pilot (R1) is therefore **not code volume** but: (1) human review of the gold unit (DG-007, owner), (2) closing the evidence loop (recall events, server read path, sync), and (3) the privacy/operations gate. The plan orders work accordingly.

## 2. Checks run for this audit

Environment: Windows 10, Node v22.14.0 (the project requires ≥ 22.18; npm warned `EBADENGINE`), npm 10.9.2, Python 3.13.7. Dependencies were installed with `npm install` because no lockfile is committed (DG-011); this resolved `next@16.4.2`.

| Command | Result |
|---|---|
| `python scripts/check_foundation.py` | **Passed** before `npm install`. After install it **fails** on hundreds of links inside `node_modules/*/README.md` because `ROOT.rglob("*.md")` skips only `.git` (finding T4). With an in-memory copy that also skips `node_modules`, the repository docs including this audit **pass** |
| `npm install --no-audit --no-fund` | Passed, 81 packages; `EBADENGINE` warning for Node 22.14 |
| `npm run content:validate` | **Passed**: 67 concepts, 1 unit, 2 routes, 210 l10n files; 0 errors, 0 warnings; en/uk/ru complete, **0 reviewed** |
| `npm run content:report` | Ran: A1 64 concepts (63 planned, 1 needs_review), A2 3 planned; 1 unit (needs_review) |
| `npm run typecheck` | **Passed** in all six workspaces |
| `npm test` | **Passed**: 253 tests, 0 failures (attempts 19, content-kit 49, gamification 16, i18n 35, learning-engine 26, web 108). DB-backed web suites skip themselves without `DG_DB_URL` |
| `npm run build` | **Passed**: static pages for en/uk/ru/ar × home, lesson, map, me, practice; 10 dynamic routes. Side effect: Next 16.4.2 rewrote `apps/web/tsconfig.json` (`jsx`, `esModuleInterop`); reverted, recorded as finding T2 |
| `npm run test:db` | **Not run here**: no PostgreSQL, `psql` or Docker on this machine. Runs in CI (`database` job, PostgreSQL 16) |
| `npm run e2e` | **Not run here**: needs a Playwright Chromium download and a running build; runs in CI (`e2e` job) |
| CI status of `main` | **Not verified**: `gh` CLI is not installed in this environment. Check the Actions tab for `e99c7f9` |

Safe way to run the missing checks: in CI (already configured), or locally with Node ≥ 22.18, Docker (`postgres:16`) and `PGHOST/PGUSER/PGPASSWORD` set, then `npm run test:db`; for E2E `npm exec -w @deutschgo/web -- playwright install chromium && npm run build && npm run e2e -w @deutschgo/web`.

## 3. Requirements and implementation matrix

### 3.1 Functional areas (PRODUCT_SPEC F1–F14)

| Area | Requirement | Status | Evidence |
|---|---|---|---|
| F1 | Explanation language choice | Done | `components/LanguageGate.tsx`, `lib/device-state.ts` (`readLanguage`), E2E `journey.spec.ts` |
| F1 | Goals (general, everyday, work, study, exam) | **Partial, inconsistent** | UI offers `life/work/study` (`device-state.ts` `GOALS`); DB enum `dg_goal` and content use `general/everyday/work/study/exam`; goal never reaches `profiles` |
| F1 | DACH context (DE/AT/CH/general) | Described | `profiles.region` exists; no UI, no use in content selection |
| F1 | Time budget | Partial | UI stores minutes **per day** (5–20); DB has `weekly_minutes`; not synced |
| F1 | Placement / starting level | Described (P4) | No item bank, no code |
| F2 | Knowledge map with search | Partial | `app/[lang]/map`, `ConceptMap.tsx`: title search, honest states; no search over German forms (needs lexicon) |
| F2 | Prerequisite guidance and catch-up path | Partial | Engine computes `available/unseen`; no catch-up sequence in the lesson page |
| F2 | Route choice, reorder, skip, multiple routes | **Missing in UI** | 2 routes in `content/routes`; `lib/path.ts` `pickLine` auto-picks one; no learner control |
| F3 | Lesson player, all block types, honest banners | Done | `LessonFlow.tsx`, `ExercisePlayer.tsx`, E2E + axe |
| F4 | 4 exercise types, shared evaluator | Done | `content-kit/src/evaluate.ts`, 49 content-kit tests |
| F4 | Matching, categorisation, error correction, dictation, listening, writing, speaking, minimal pairs | Described | Not in schema or evaluator |
| F5 | Review scheduler v1 | **Partial, ineffective in app** | `learning-engine/src/scheduler.ts` tested; app emits only `attempt` events, so schedules never advance (finding E1) |
| F5 | Daily load control, "again" semantics per type | Described | — |
| F6 | Reading, listening, dictionary, saved vocabulary | Described | `saved_vocabulary` table only; no lexicon schema; ADR-0007 proposed |
| F7 | Evidence events, concept states, explainable recommendations | Partial | Engine Done (26 tests); server writes `learning_events` + caches; UI reads device events only |
| F7 | Analytics on own learning with evidence | Partial | Learner area shows device stats; no per-skill view |
| F8 | Writing, speaking | Described (P5) | — |
| F9 | Google/Apple sign-in, PKCE, HttpOnly session | Done in code, **not configured** | `lib/auth/*`, `app/auth/*`, `test/auth.test.ts`, `test/jwt.test.ts`; owner steps in ACCOUNTS_SETUP |
| F9 | Email magic link | Described | ADR-0013 deferred it; F9 and DATA_AND_PRIVACY still require it |
| F9 | Token refresh | Missing | ADR-0013 consequence; session ends after ~1 h |
| F9 | Offline queue and idempotent sync | Described (P3) | Server is idempotent on event id; client sends once and forgets (`ExercisePlayer.tsx` uses a new `randomUUID` per send, different from the device event id) |
| F9 | Cross-device continuation | **Missing** | No read endpoint for events/states; all screens read `localStorage` |
| F9 | One-time import of device history after sign-up | Described | DATA_AND_PRIVACY §Authentication; no code |
| F9 | GDPR export | **Partial** | `export_my_data()` exists and is RLS-tested; no endpoint or UI; omits `push_subscriptions` |
| F9 | Account deletion | Done in code | `app/auth/delete`, cascade tested in SQL; needs service-role key (owner) |
| F9 | Device data deletion | Done | `clearDeviceData`, E2E |
| F10 | UI catalogs en/uk/ru + ar preview, RTL | Done | `packages/i18n`, parity tests; uk/ru/ar strings are machine drafts |
| F10 | Per-language availability from coverage | Done | validator coverage table |
| F10 | Region preference affects examples/notes | Described | — |
| F11 | Entitlements and billing | Described (P7) | `entitlements` table only (free-during-build-out decision) |
| F12 | Cookieless product analytics | **Missing** | needed to measure R1 exit criteria |
| F13 | Error monitoring, uptime, backups with restore test | **Missing** | OPERATIONS marks them P2/P3 |
| F13 | Changelog, incident template, content dashboard | Missing | OPERATIONS promises `CHANGELOG.md` "from P2" |
| F14 | Content contract, validation, compiled bundle | Done | ADR-0003, CI |
| F14 | Human review gates | Blocked | DG-007 has no reviewers yet |

### 3.2 Platform, security and operations

| Item | Status | Evidence |
|---|---|---|
| Learner schema with RLS on every table, append-only events, revoked privileges | Done | `supabase/migrations/0001`, `0002`; SQL tests `10`–`14` (CI) |
| Server re-evaluation of attempts | Done | `packages/attempts`, `lib/attempts/handler.ts`, integration test in CI |
| Hosted Supabase project (EU) | Done (created), migration state **Verify** | PROJECT_STATUS says 0001 applied; 0002 (`push_subscriptions`) not recorded as applied |
| Session token verification | Done for HS256; **Verify** algorithm | `lib/auth/jwt.ts` accepts only HS256 and treats `exp` as optional, checks no `aud`/`role`. If the hosted project signs with asymmetric keys, every sign-in fails (finding S1) |
| Test sign-in on previews | Done, gated | `lib/auth/config.ts` `testLoginEnabled` refuses `VERCEL_ENV=production` |
| Cron authorisation | Done | `lib/push/config.ts` constant-time bearer check, ≥16 chars |
| Rate limiting on write endpoints | **Missing** | Required by DATA_AND_PRIVACY §Security; no code |
| Audit log of export/deletion | Missing | `audit_log` table is never written |
| Privacy notice, processor list, Impressum | **Missing** | no route or document; required before collecting learner data |
| Monitoring with PII scrubbing | Missing | — |
| Backups + restore test | Missing | — |
| Lockfile and pinned toolchain | **Missing** (DG-011) | no `package-lock.json`; CI uses `npm install`; local install resolved Next 16.4.2, whose build rewrote `tsconfig.json` |
| PWA install + offline reading of opened pages | Done | ADR-0012, `public/sw.js`, `pwa.spec.ts` |
| Accessibility (axe, keyboard, 44px, 320px) | Done in CI | `a11y.spec.ts`, `mobile.spec.ts` |
| Performance budget | Described | OPERATIONS cost triggers only; no measurement |

## 4. Architecture assessment and contradictions

**Fit with the vision.** The architecture fits a deep, multilingual, evidence-based product: content, curriculum, learner state, localization and UI are genuinely separated (content-kit, learning-engine, attempts, i18n, `lib/data`). Evidence is append-only and derived state is recomputable, which keeps later scheduler changes (FSRS) migration-free. The modular monolith is right for the team size. Nothing found requires an architectural rewrite; the risks are unfinished seams, not wrong foundations.

**Where it can force rework later:**
- **A1 Two sources of truth for progress.** The device log (`deutschgo.events.v1`) and the server log use different event ids and are never reconciled. Every feature built on device numbers (XP, streak, hearts, practice list, map states) will need rewiring once the server is the source of truth. Decide the sync model before adding more device-only features (BACKLOG DG-022…DG-024).
- **A2 Event kinds are not chosen by anyone.** The engine distinguishes `attempt`, `recall`, `transfer`, `exposure`; the app and the attempts API only know `attempt`. Without a rule for when an answer is a recall (e.g. answered while the concept is due), spaced repetition and mastery cannot work. Needs a small ADR (DG-021).
- **A3 Learner profile lives in three shapes.** Device setup (`goal`, minutes/day), DB `profiles` (goals[], weekly_minutes, region, langs) and content `goals` use different vocabularies. Align before onboarding is extended (DG-029).
- **A4 Auth verification tied to HS256 shared secret.** Fine for legacy Supabase projects; a JWKS path is needed if the project uses signing keys (DG-026).
- **A5 Rate limiting has no home.** Vercel functions are stateless; a limiter needs Postgres or a KV store: a provider decision (DG-027).

**Contradictions and stale statements found** (✔ = corrected in this PR):

| # | Where | Contradiction | Resolution |
|---|---|---|---|
| C1 | PROJECT_STATUS, BACKLOG | DG-015, DG-019, DG-020 "in review" | ✔ merged in #43, #46; status rewritten |
| C2 | PROJECT_STATUS "Not implemented: … hosted database" vs its own line 13 and ADR-0013 | hosted project exists | ✔ |
| C3 | DATA_AND_PRIVACY "no hosted project exists yet" | same | ✔ |
| C4 | ARCHITECTURE "auth calls inside `lib/data`" | auth lives in `lib/auth` | ✔ |
| C5 | ADR index: ADR-0014/0015 "Accepted, implementing" | merged; push not configured | ✔ "implemented; push awaits owner setup" |
| C6 | PRODUCT_SPEC feature table "as of 2026-10-12" | F7, F9, F2, F5 statuses outdated | ✔ refreshed with a pointer to this audit |
| C7 | CLAUDE.md repository map | `packages/gamification` missing | ✔ one line added |
| C8 | `lib/device-state.ts` header and `clearDeviceData` comment: "Nothing here is sent to the server … this is the whole of the learner's data" | false for signed-in learners since DG-015; the UI copy (`profile.accountNote`) is scoped correctly | code comment; fixed in DG-024 (no code change in an audit) |
| C9 | Device goals `life/work/study` vs spec/DB/content goals | three vocabularies | owner decision Q4, task DG-029 |
| C10 | Vision principle 3 "never hard locks" vs ADR-0014 hearts pausing "Check" **inside the first lesson** | the ADR guardrail allows it (explanations stay open), but a new learner can be stopped from producing evidence in their first lesson | owner decision Q3, task DG-034 |
| C11 | F9 and DATA_AND_PRIVACY require email magic link; ADR-0013 ships only Google/Apple, Apple needs a paid developer account | scope gap | owner decision Q2 |
| C12 | OPERATIONS "monitoring (P2)" and "changelog from P2"; QUALITY_GATES lists E2E as "P2" though it runs in CI | partially stale | ✔ QUALITY_GATES row; monitoring stays a task (DG-031) |
| C13 | BACKLOG "Recommended order … DG-015 → DG-013" | DG-013 was already done | ✔ replaced by the new register |

## 5. Risks and technical debt (prioritised)

| ID | Priority | Finding | Consequence | Task |
|---|---|---|---|---|
| E1 | **Critical** | Only `attempt` events are produced; scheduler advances only on `recall`; mastery needs ≥2 recalls | Spaced repetition and "provisionally mastered" never happen for real learners; the core promise of the engine is untestable with users | DG-021 |
| P1 | **Critical** | Learner data could be collected in production as soon as env vars are set, before privacy notice/Impressum, monitoring, backups, rate limits, export | GDPR exposure; violates RELEASE_STAGES gate 5 and the P3 privacy gate | DG-030 (+ DG-027, 028, 031, 032); owner rule Q1 |
| C-1 | **Critical (owner)** | Gold unit unreviewed; content batches blocked | No content can be released; R1 needs 10–15 reviewed units | DG-007 |
| S1 | High | JWT verifier: HS256-only, `exp` optional, no `aud` check; hosted project's signing method unverified | Either sign-in fails entirely (asymmetric keys) or a non-expiring token signed with the secret is accepted | DG-026 |
| D1 | High | Device and server progress never reconciled; no read path | No cross-device learning; R1 core journey "across devices" fails | DG-022, DG-024 |
| D2 | High | Failed attempt sends are dropped (no retry/queue) | Silent evidence loss on flaky mobile networks; R1 "zero data-loss" criterion at risk | DG-022, DG-023 |
| T1 | High | No lockfile, CI `npm install`, Node not pinned (local 22.14 < 22.18) | Non-reproducible builds; upstream releases change behaviour (seen: Next 16.4.2 rewrote tsconfig) | DG-011 |
| S2 | High | No rate limiting on `/api/attempts`, `/auth/test`, `/api/push/subscribe` | Abuse, cost spikes, account spam on previews | DG-027 |
| O1 | High | No monitoring, no analytics | R1 exit criteria (≥90 % sessions complete, zero data loss) cannot be measured | DG-031, DG-033 |
| S3 | Medium | Session ends after ~1 h, no refresh | Learners silently stop saving mid-session | DG-025 |
| G1 | Medium | GDPR export not exposed, omits `push_subscriptions`; `audit_log` never written | Export promise unfulfilled | DG-028 |
| M1 | Medium | Hearts can pause checking in the first lesson | Conflicts with "never hard locks"; reduces evidence | DG-034 (owner Q3) |
| M2 | Medium | XP/streak/hearts device-only | Numbers differ per device; trust | DG-035 |
| R1 | Medium | Push cron at 17:00 UTC for everyone; migration 0002 on hosted DB unverified | Reminders at wrong local times; cron errors | DG-036 |
| Q1 | Medium | No E2E of the signed-in journey (CI only checks the unconfigured state) | The P2 exit criterion cannot pass in CI | DG-037 |
| L1 | Low | Arabic preview has no Arabic font | Poor RTL rendering | DG-039 |
| T2 | Low | `next build` mutates `apps/web/tsconfig.json` with newer Next | Dirty working trees after builds | DG-011 |
| T4 | Medium | `scripts/check_foundation.py` scans `node_modules`, so `npm run check` fails on every machine with dependencies installed (CI's foundation job has none, so CI stays green) | The documented "run everything" command is unusable locally | DG-011 |
| T3 | Low | `push_subscriptions.endpoint` is globally unique | Second account on the same browser cannot subscribe | DG-036 |

## 6. Product journey readiness (the ten steps of DG-AUDIT-001)

| Step | Readiness | What is needed |
|---|---|---|
| 1 Visit and register | Visit: works. Register: built, not configured; Apple paid; no email sign-in | Owner setup (ACCOUNTS_SETUP), DG-026, DG-025, privacy gate DG-030, decision Q2 |
| 2 Explanation language and goals | Language: works (en/uk/ru, ar preview). Goals: inconsistent vocabulary, device only | DG-029 |
| 3 Level and interests | Not available (no placement, no interests/region) | DG-029 (region, self-report), DG-053 placement (P4) |
| 4 Choose/change/personalise route | Not available (auto-picked line) | DG-047 |
| 5 Theory and varied exercises | One unreviewed lesson, 4 closed exercise types | DG-007, content batches DG-042/043, exercise types DG-045 |
| 6 Listen to and understand German | Not available | ADR-0007 decision DG-054, DG-055/056 (P5) |
| 7 Review and work on mistakes | Wrong answers return at lesson end; practice list exists; scheduler ineffective | DG-021, DG-048 |
| 8 Save progress, continue on another device | Writes to server when configured; never reads back | DG-022, DG-023, DG-024, DG-035 |
| 9 Measurable results, next topics | Device stats; next lesson only among 1 lesson | DG-021, content batches, DG-049 |
| 10 Free and paid features | Everything free by decision (2026-10-19); `entitlements` seam exists | P7 DG-063; nothing before R3 |

## 7. Decisions needed from the owner

| # | Question | Why it blocks | Options (recommendation first) |
|---|---|---|---|
| Q1 | May sign-in, `DATABASE_URL` and push be configured on **production**, or only on previews, until the privacy gate passes? | Prevents collecting real learner data too early | **Previews only until DG-030/031/032 pass** · production now with a "test phase" notice |
| Q2 | Add email magic-link sign-in, and is the paid Apple Developer account wanted now? | Apple costs money; spec requires email | **Google + email first, Apple when native apps or demand** · keep Google + Apple |
| Q3 | Hearts in the first pass of a lesson? | Vision "no hard locks" vs ADR-0014 | **Hearts only in practice/review; lessons never pause** · keep as is · remove hearts |
| Q4 | Goal taxonomy for onboarding | Three vocabularies in code | **Spec set (general, everyday, work, study, exam) with learner-friendly labels** · keep life/work/study and migrate DB/content |
| Q5 | Reviewers for DG-007 (German, pedagogy, uk, ru) and budget | Critical path for all content | paid freelance reviewer · volunteer · AI pre-review + one paid human pass |
| Q6 | Monitoring and analytics providers (EU) | Needed before R1 | Sentry EU + Plausible/Umami (self-hosted) · Vercel built-ins only |
| Q7 | Rate-limit store | DG-027 | **Postgres table (no new provider)** · Upstash/Vercel KV |
| Q8 | Supabase plan for backups (daily backups need a paid plan) | DG-032 | Pro plan · free plan + weekly `pg_dump` by CI to EU storage |
| Q9 | Product name, domain, legal entity (existing blocker 4) | Impressum and privacy notice need them | — |
| Q10 | Rights confirmation for original content | Release gate 2 | — |

## 8. Recommended first task after this audit

**DG-011 — commit the lockfile, pin Node, switch CI to `npm ci`.** It is small, needs no owner decision (this audit showed a local install from the registry works), removes the non-reproducible-build risk (T1, T2) that affects every later PR, and unblocks reliable verification of the critical fixes that follow. Immediately after: **DG-021** (recall events, ADR + engine/API change), which fixes the single largest functional gap, while the owner works on DG-007 reviewers and decision Q1 in parallel.
