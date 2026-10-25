# Task Register (backlog)

Last rebuilt: 2026-10-22 by the project audit ([PROJECT_AUDIT_2026-10-22](./PROJECT_AUDIT_2026-10-22.md)). Phase order and gates: [roadmap](./ROADMAP.md). The GitHub issue tracker is the live list; every task here becomes an issue when it starts, using the fields below. Owner decisions are referenced as **Q1…Q10** from audit section 7.

Ordering rule: tasks are ordered by dependency and risk, not by visibility. Stage A removes blockers and architectural risks, Stage B closes the learner loop, Stage C fills it with reviewed content, later stages extend the product. WIP limits: [project management](./PROJECT_MANAGEMENT.md).

## Done (history)
DG-001 journey and release scope · DG-002 content contract + gold unit (review continues in DG-007) · DG-003 stack ADRs · DG-004 localization policy · DG-006 umbrella (split into 008–010) · DG-008 learner schema + RLS tests · DG-009 attempt recording · DG-010 learning engine v1 · DG-012 A1 concept graph (67 planned) · DG-013 Playwright + axe, Vercel previews · DG-014 UI catalogs + RTL · DG-016 installable PWA · DG-017 visual system · DG-018 learner area · DG-019 phone lesson polish (#43) · DG-015 sign-in code, Google/Apple, account deletion (merged with #46; not configured) · DG-020 XP, streaks, hearts, push reminders (#46; push not configured) · DG-025 session refresh (#52; not configured) · DG-AUDIT-001 this audit.

## Overview

| ID | Task | Stage | Depends on | Ready? |
|---|---|---|---|---|
| DG-011 | Lockfile, pinned Node, `npm ci` | A | — | **in review** (branch `chore/dg-011-reproducible-builds`) |
| DG-021 | Recall events: when an answer counts as review | A | ADR-0016 | **in review** (branch `feat/dg-021-review-evidence`) |
| DG-026 | Session token verification hardening (exp/aud, signing method) | A | — | **in review** (branch `feat/dg-026-session-verification`) |
| DG-027 | Rate limiting on write endpoints | A | Q7 decided (ADR-0017: Postgres table) | implemented (PR, owner applies migration 0003) |
| DG-030 | Privacy gate pack: privacy notice, Impressum, processor list, retention | A | Q1, Q9 | **needs owner** |
| DG-007 | Human review of the gold unit + rights | C (critical path) | Q5, Q10 | **needs owner** |
| DG-022 | One event identity + retry of failed sends | B | DG-021 | **in review** (branch `feat/dg-022-event-identity-retry`) |
| DG-023 | Offline queue and batched sync (IndexedDB); must define how queued answers are dated, replacing the 15-minute backdating bound of ADR-0016 | B | DG-022 | after DG-022 |
| DG-024 | Server read path, device-history import, cross-device continuation | B | DG-022 | after DG-022 |
| DG-025 | Session refresh | B | — | **done** (#52, merged before DG-026; DG-026 must keep it working) |
| DG-028 | GDPR export end to end + audit log | B | DG-024 | after DG-024 |
| DG-029 | Profile and onboarding model alignment (goals, region, time budget) | B | Q4 decided (ADR-0017: spec goal set) | implemented on device (`feat/dg-029-goal-model`); profile sync with DG-024 |
| DG-031 | Error monitoring + uptime (EU, PII scrubbing) | B | Q6 | needs decision |
| DG-032 | Backups and a recorded restore test | B | Q8 | needs owner |
| DG-033 | Cookieless product analytics baseline | B | Q6, DG-030 | needs decision |
| DG-034 | Hearts scope (lesson vs practice) | B | Q3 decided (ADR-0017) | **in review** (branch `feat/dg-034-hearts-scope`) |
| DG-035 | Motivation numbers from server evidence when signed in | B | DG-024 | after DG-024 |
| DG-036 | Reminder timing, subscription uniqueness, hosted migration check | B | owner push setup | after setup |
| DG-037 | E2E of the signed-in journey in CI | B | DG-024 | after DG-024 |
| DG-038 | Changelog and incident template | B | — | ready (small) |
| DG-040 | Email magic-link sign-in | B | Q2 | needs decision |
| DG-041 | Contract v1.x adjustments from the gold review | C | DG-007 | blocked |
| DG-042 | A1 sentence-structure batch 1 (≤5 units) | C | DG-041 | blocked |
| DG-043 | A1 batches 2–3 (to 10–15 reviewed units) | C | DG-042 | blocked |
| DG-044 | Review records and content dashboard | C | — | ready |
| DG-045 | Exercise types v2: matching, categorisation, error correction | C | contract §8 | ready (design) |
| DG-065 | A0 lesson norms in the validator, lesson builder, lesson standard and production plan | C | ADR-0023 amendment | **done** (2026-10-25) |
| DG-066 | Regenerate `curriculum/A0` from the A0 subtopic list (one subtopic per lesson, content titles) | C | owner approval of the subtopic list | ready |
| DG-067 | Calibrate the per-type exercise times in `norms.ts` from real attempt durations | C | learners using the app | after launch data |
| DG-068 | A0 batches: A0.02 rest + A0.03, then A0.04 + A0.05, then A0.06 (production plan §5) | C | DG-065 | next |
| DG-046 | Lesson `depth` tag (core, standard, deep) in the contract, course tiers (fast, medium, full) in content-kit, and a per-tier, per-level count in the content report; tests for checkpoint per block | Schema fixtures; tests that each tier covers every level; report shows counts | DG-041, ADR-0018 |
| DG-046 | Prerequisite guidance and catch-up path | D | DG-024 | P3 |
| DG-047 | Route choice and personalisation | D | DG-029 | P3 |
| DG-048 | Review session (daily load, "again") | D | DG-021, DG-024 | P3 |
| DG-049 | Visible recommendation reasons with override | D | DG-024 | P3 |
| DG-039 | Arabic font for the preview locale | D | — | ready (small) |
| DG-005 | Vet first external sources (frequency data) | E | — | ready (research) |
| DG-050 | Lexicon schema ADR + schema (lemma/sense/forms) | E | DG-005 | P4 |
| DG-051 | Reading pilot (original texts) | E | DG-050, DG-043 | P4 |
| DG-052 | Tap-to-look-up, saved vocabulary, vocabulary review | E | DG-050, DG-048 | P4 |
| DG-053 | Placement v1 with uncertainty | E | DG-043 | P4 |
| DG-054 | Decide ADR-0007 media and audio | F | owner budget | P5 |
| DG-055 | Audio pipeline (storage, manifests, player) | F | DG-054 | P5 |
| DG-056 | Listening tasks and dictation | F | DG-055 | P5 |
| DG-057 | Writing tasks with rubric | F | DG-045 | P5 |
| DG-058 | Speaking practice (shadowing, prepared answers) | F | DG-055 | P5 |
| DG-059 | Regional German (Austria, Switzerland) after the general course, deferred by ADR-0020 | F | DG-043, ADR-0020 | deferred |
| DG-060 | FSRS-class scheduler v2 with A/B | G | DG-021, history | P6 |
| DG-061 | Learning analytics and item difficulty | G | DG-033 | P6 |
| DG-062 | Wave-2 explanation languages | G | coverage policy | P6 |
| DG-063 | Freemium and billing as one change (ADR-0008) | H | R2 data, legal | P7 |
| DG-064 | Native apps (Capacitor), B2–C1, professions | I | P7 | P8 |

## Stage A — critical fixes and decisions before more features

### DG-011 Lockfile, pinned Node, `npm ci`
- **Goal:** reproducible installs and builds. **State:** no `package-lock.json`; CI uses `npm install`; `engines` says Node ≥ 22.18 but nothing pins it; the audit's install resolved Next 16.4.2, whose build rewrote `apps/web/tsconfig.json`.
- **Changes:** generate and commit `package-lock.json` with Node 22.18+; add `.nvmrc`/`.node-version`; CI `npm ci` and `node-version-file`; remove the lockfile-artifact step; commit the tsconfig form Next expects so builds leave the tree clean; make `scripts/check_foundation.py` skip `node_modules` and `.next` (audit finding T4).
- **Acceptance:** CI green with `npm ci`; `npm run build` leaves `git status` clean; `npm ci` on a fresh clone reproduces the same versions; `npm run check` passes locally with dependencies installed.
- **Result (2026-10-22):** `.nvmrc` 22.23.4, `engines` `^22.18.0` in the root and `apps/web` (caps the major Vercel picks; a first version with `.npmrc` `engine-strict` failed the Vercel preview and was dropped), lockfile v3 (Next 16.4.2) with all platform binaries, CI `npm ci` + npm cache + a guard that fails when install/tests/build leave modified or new unignored files, Next's required tsconfig, foundation check prunes dependency/build directories and has self-tests (`scripts/foundation.py`), `npm run foundation` picks a working Python once (Windows has no real `python3`). Independent agent review: no blockers; its three minor findings were fixed. The stale branch `chore/dg-011-commit-lockfile` held no lockfile and was not reused.
- **Checks:** `npm ci && npm run check`; CI all four jobs. **Risks:** a version bump hidden in the lock; review the diff of resolved majors. **Approval:** none (owner blocker removed: a local install from the registry works).

### DG-021 Recall events: when an answer counts as review
- **Goal:** spaced repetition and mastery work for real learners. **State:** engine needs `recall` events (`scheduler.ts`, `states.ts`); app and `packages/attempts` only create `attempt` (finding E1).
- **Changes (as decided in ADR-0016):** the engine counts a graded answer given while the concept is due as a review, on device and server alike; the server bounds backdated answer times; device answers carry the exercise's concepts; `ENGINE_VERSION` 1.1.0; fixtures.
- **Acceptance:** a fixture learner moves through steps 1→3→7 days and reaches `provisionally_mastered`; a failed review resets; the client can neither declare a review nor fake one by backdating.
- **Checks:** learning-engine and attempts unit tests, attempt-store integration test (CI DB job), journey E2E. **Risks:** existing stored events stay `attempt` (append-only). **Approval:** the ADR (technical; owner informed).
- **Result (2026-10-22):** [ADR-0016](../architecture/decisions/ADR-0016-review-evidence.md) chose derivation-time classification instead of a server-side `recall` kind: the engine treats any graded result given while due as a review, so it is order-independent, identical on device and server, and needs no API or schema change; existing answers count retroactively. `ENGINE_VERSION` 1.1.0. Explicit `recall` events remain for the review session (DG-048).

### DG-026 Session token verification hardening
- **Goal:** sign-in works with the hosted project and rejects weak tokens. **State:** `lib/auth/jwt.ts` accepts HS256 only, `exp` optional, no `aud`/`role` check; the hosted project's signing method is unverified.
- **Changes:** require `exp`; require `aud = authenticated` and `role = authenticated`; if the project uses asymmetric signing keys, verify via JWKS (maintained library or `node:crypto` ES256) and amend ADR-0013.
- **Acceptance:** tests for missing `exp`, wrong `aud`, `alg` confusion, ES256 when enabled; a real token from a preview verifies. **Checks:** `test/jwt.test.ts`, `test/auth.test.ts`, manual preview sign-in. **Approval:** none: the signing method was read from the project's public JWKS.
- **Result (2026-10-22):** the hosted project signs with **ES256** (public JWKS), so the HS256-only verifier would have rejected every real sign-in. Now: JWKS verification (ES256/RS256, cached, refresh-limited, outage-tolerant), HS256 only with the optional legacy secret, `exp`/`aud`/`role` required; `SUPABASE_JWT_SECRET` optional; ADR-0013 amended. Still open: a real provider round trip on a configured preview (owner setup).

### DG-051 Continuous course plan (ADR-0018 amendment)
- **Goal:** 5000 lessons in one chain from A0 to C2, with topic order, dependencies and word targets. **State:** plan generated under `curriculum/` (topics are a draft for review); `scripts/curriculum_plan.py --check` guards it.
- **Acceptance:** chain verified by the generator; topics depend only on earlier topics; tier and choice rules tested in `apps/web/test/topic-choices.test.ts`.

### DG-053 Audio for lessons
- **Goal:** listening and pronunciation audio for every example and exercise. **State:** not started. **Decided:** ADR-0019 (free Piper voice, generated offline). **Needs:** the generation script, a schema field for audio, storage for generated files.

### DG-054 Exercise types catalogue (many formats, like tests)
- **Goal:** more exercise types beyond single choice, word order and cloze, such as matching, gap fill with a bank, categorisation, error correction, listening choice, dictation. **State:** four types exist. **Depends:** DG-045 and CONTENT_CONTRACT §8 for each new type (schema, evaluator tests, player).

### DG-052 Learner topic choices in the app
- **Goal:** want/skip per topic on the profile, with conflict messages. **State:** logic only (`lib/topic-choices.ts`). **Needs:** reviewed topic names; no UI until then.

### DG-027 Rate limiting on write endpoints
- **Goal:** abuse and cost protection required by DATA_AND_PRIVACY. **State:** none.
- **Changes:** per-user and per-IP limits for `/api/attempts`, `/auth/test`, `/auth/start`, `/api/push/subscribe`; store per Q7 (recommended: Postgres table with service role, no new provider); 429 with `Retry-After`; client treats 429 as retryable.
- **Acceptance:** limits are documented, unit-tested, integration-tested against PostgreSQL; normal lesson pace is never limited. **Approval:** Q7.
- **State:** implemented on `feat/dg-027-rate-limits`. Migration `0003_rate_limits.sql` and `supabase/tests/15_rate_limits.sql` (local PostgreSQL 16: all pass). Limits: attempts 120/min per learner, push 20/min per learner, sign-in start 30/min per address, test sign-in 5/hour per address. Subjects are hashed. 429 carries `Retry-After`; the outbox already retries 429. **Owner action:** apply `0003_rate_limits.sql` to the hosted Supabase project before setting `DATABASE_URL` on a deployment; until then the limiter logs and allows requests.

### DG-030 Privacy gate pack
- **Goal:** lawful collection of learner data. **State:** no privacy notice, Impressum, processor list or retention statement in the app.
- **Changes:** pages rendered from content/legal text (not hard-coded components), linked from the footer and sign-in; processor list (Vercel, Supabase, later monitoring/analytics); retention per DATA_AND_PRIVACY; localized en/uk/ru with honest draft labels.
- **Acceptance:** QUALITY_GATES privacy gate items checked with evidence; sign-in is shown only where Q1 allows. **Approval:** owner/legal text, Q1, Q9.

### DG-007 Human review of the gold unit (critical path, owner)
Unchanged: reviewers per [GOLD_UNIT_REVIEW_PACKET](../quality/GOLD_UNIT_REVIEW_PACKET.md); rights confirmation. **Acceptance:** recorded linguistic, pedagogical and uk/ru reviews; status raised only by the validator-enforced rule. **Approval:** Q5, Q10.

## Stage B — close the learner loop (P2 exit)

### DG-022 One event identity + retry
- **Goal:** one answer is one event everywhere. **State:** `ExercisePlayer.tsx` records a device event and sends a server event with a different `randomUUID`; failures are dropped; device events carry no error-rule `signals` (ADR-0016 consequence).
- **Changes:** reuse the device event id as `eventId`; mark device events `synced`/`pending`; retry pending events with backoff on load/online (server is idempotent on id).
- **Acceptance:** unit tests for retry and idempotency; a network failure followed by reload results in exactly one server row. **Depends:** DG-021. **Risks:** existing device events have no server twin; handled by DG-024 import.

- **Result (2026-10-22):** one id and one time per answer, shared by the device record and the account copy; a write-ahead outbox in this browser (`lib/attempts/outbox.ts`, `deutschgo.outbox.v1`) queues every submission before it is sent and removes it on a final answer (saved, not signed in, content changed, refused); network, 408/429 and 5xx failures retry with backoff (30 s doubling to 1 h, 8 tries) when a page opens, when the connection returns and once a minute (`OutboxSync`); the lesson says "this browser will send it again" instead of "it will not appear in your progress"; device events now carry error-rule signals through the evaluator's shared `signalledConcepts()`. Not included: IndexedDB, batching and dating of long-queued answers (DG-023); answers given while signed out are not uploaded later (DG-024 import).

### DG-023 Offline queue and batched sync
- **Goal:** answers given offline reach the account. **Changes:** IndexedDB outbox, batch endpoint or batched calls, offline/unsynced states in the UI (USER_FLOWS cross-flow states).
- **Acceptance:** E2E offline → online sync; counts shown as "not yet saved" until confirmed. **Depends:** DG-022.

### DG-024 Server read path and cross-device continuation
- **Goal:** the P2 exit criterion "across devices". **State:** no endpoint returns events/states; every screen reads `localStorage`.
- **Changes:** `GET /api/progress` (no-store, as learner under RLS) returning events since a cursor and derived states; client merges by event id; one-time import of device history after first sign-in with consent (DATA_AND_PRIVACY); fix the stale comments in `lib/device-state.ts`.
- **Acceptance:** two browser contexts with one account show the same states; import is idempotent; signed-out behaviour unchanged. **Checks:** integration test against PostgreSQL, E2E (DG-037). **Approval:** none beyond Q1.

### DG-025 Session refresh
Refresh token in its own HttpOnly cookie, rotation on use, sign-out revokes. **Acceptance:** a 2-hour session keeps saving; refresh failure shows "signed out", never silent loss. **Depends:** DG-026.

### DG-028 GDPR export end to end
Endpoint + "Download my data" in the learner area; migration `0003` adds `push_subscriptions` to `export_my_data()`; write `audit_log` rows for export and deletion. **Acceptance:** SQL test for export completeness, E2E download. **Depends:** DG-024.

### DG-029 Profile and onboarding model alignment
- **Goal:** one vocabulary for goals, region and time budget. **State:** device `life/work/study` + minutes/day; DB `dg_goal` + `weekly_minutes` + `region`; content goals use the DB set.
- **Changes:** adopt the Q4 decision; add region choice (DE/AT/CH/general); save profile to `profiles` when signed in; migrate the device value.
- **Acceptance:** setup round-trips through the profile; old device setups are migrated, not lost. **Approval:** Q4.

### DG-031 Monitoring · DG-032 Backups · DG-033 Analytics
- DG-031: error monitoring (EU, PII scrubbing per DATA_AND_PRIVACY "logs exclude tokens …"), uptime check, alert thresholds recorded in OPERATIONS. Q6.
- DG-032: backup schedule per Q8 and a **recorded restore test** into a scratch project/database. Owner authorization for any production action.
- DG-033: cookieless events for the R1 exit metrics (session start, lesson complete, sync failures), no personal identifiers, listed in the privacy notice. Q6, DG-030.

### DG-034 Hearts scope
Implement Q3 (recommended: hearts apply to practice/review only; lesson exercises never pause). Update ADR-0014 guardrail. **Acceptance:** gamification tests; E2E: a learner with 0 hearts can finish a new lesson.

### DG-035 Motivation from server evidence
When signed in, XP/streak/hearts are computed from the merged event log (ADR-0014 §8). **Depends:** DG-024.

### DG-036 Reminders hardening
Send at the learner's chosen local hour (store time zone with the subscription); allow the same endpoint for a new account (re-own on subscribe); confirm migration 0002 is applied on the hosted project (owner, read-only check). **Depends:** owner VAPID/cron setup.

### DG-037 E2E of the signed-in journey
CI job with PostgreSQL and a test-only token issuer (never in production builds) covering setup → lesson → persisted attempt → state → next step → second context sees it. Turns the P2 exit criterion into a check.

### DG-038 Changelog and incident template · DG-040 Email sign-in
- DG-038: `docs/development/CHANGELOG.md` and a post-mortem template, as OPERATIONS promises.
- DG-040: magic-link sign-in via Supabase Auth (SMTP provider is an owner decision), same 16+ gate. Q2.

## Stage C — reviewed content (continuous, review-paced)

| ID | Goal and changes | Acceptance | Depends |
|---|---|---|---|
| DG-041 | Contract v1.x adjustments from the DG-007 findings (CONTENT_CONTRACT §8) | Schema change with fixtures; gold unit re-validated | DG-007 |
| DG-042 | A1 sentence-structure batch 1, ≤5 units with en/uk/ru drafts (skill `create-lesson`) | Validator passes; each unit reviewed before the next batch | DG-041 |
| DG-043 | Batches 2–3 to reach 10–15 reviewed units on `route.core.a1_sentence_foundations` | R1 content gate | DG-042 |
| DG-044 | Review records in the repo and a generated content dashboard (coverage, review queues, stale translations) | Dashboard generated from validator output in CI | — |
| DG-045 | Exercise types v2 (matching, categorisation, error correction) in schema + evaluator + player | Evaluator tests for each type, invalid fixtures, axe | contract §8 |
| DG-065 | Lesson norms (`norms.ts`) as validator errors for A0, `scripts/lesson_builder.py`, the lesson standard and the [production plan](../domain/LESSON_PRODUCTION_PLAN.md) | Norm tests; repository content passes with zero errors | ADR-0023 |
| DG-066 | `curriculum/A0` regenerated from `A0_SUBTOPICS_PROPOSAL.md` | `scripts/curriculum_plan.py --check` passes; no duplicate titles | owner approval |
| DG-067 | Exercise-time calibration from attempt durations | Median time per type recorded; `EXERCISE_SECONDS` updated with the data source | learner data |
| DG-068 | A0 batch production (50–100 lessons per PR) | Each batch: zero validator errors, sample review, route in plan order | DG-065 |

## Stages D–I — product depth (expanded into issues when their phase starts)

| ID | Goal | Acceptance | Depends |
|---|---|---|---|
| DG-046 | Missing/weak prerequisites shown on a unit with a catch-up path; never blocking | E2E with a fixture learner | DG-024 |
| DG-047 | Choose, switch, skip and reorder routes; exploration keeps the active route | Route state in profile; E2E | DG-029 |
| DG-048 | Review session with daily load control and "again" semantics | Engine tests; E2E | DG-021, DG-024 |
| DG-049 | Recommendation reasons visible, with override | Reason codes rendered in all languages | DG-024 |
| DG-039 | Arabic font for the preview locale | Visual check RTL, no layout shift | — |
| DG-005 | Vet frequency data source for A1 vocabulary | Source register entry with licence | — |
| DG-050 | Lexicon ADR and schema (lemma → senses → forms, gender, plural, government) | Validator + fixtures | DG-005 |
| DG-051 | Reading pilot with original texts linked to concepts/vocabulary | Reviewed texts; reading UI | DG-050, DG-043 |
| DG-052 | Tap-to-look-up, save word in context, vocabulary review | `saved_vocabulary` used; review items | DG-050, DG-048 |
| DG-053 | Placement v1: item bank, estimate with uncertainty, editable | Never claims official CEFR | DG-043 |
| DG-054 | Decide ADR-0007 (storage, recorded speech, TTS labelling, budget) | ADR accepted | owner |
| DG-055 | Audio pipeline: object storage, manifests in Git, player, offline policy | Rights recorded per file | DG-054 |
| DG-056 | Listening comprehension and dictation | Real audio, transcripts, replay | DG-055 |
| DG-057 | Writing with purpose/audience/rubric; automatic checks only (no AI per ADR-0014 §7) | Rubric documented per task | DG-045 |
| DG-058 | Speaking: shadowing, prepared answers, record and compare; no unvalidated scores | Honest labels | DG-055 |
| DG-059 | Regional German (Austria, Switzerland) after the general course, deferred by ADR-0020 | Reviewed regional notes only | DG-043, ADR-0020 |
| DG-060 | FSRS-class scheduler v2, A/B against v1 | Pre-registered metric, rollback rule | DG-021, history |
| DG-061 | Learning analytics, item difficulty, accepted-answer gaps | Aggregated, no personal identifiers | DG-033 |
| DG-062 | Wave-2 languages (tr, ar, pl, ro) where coverage policy is met | Coverage disclosed | reviewers |
| DG-063 | Freemium + billing as one change: ADR-0008, entitlements, pricing, legal | MONETIZATION principles; server-side enforcement | R2 data, legal |
| DG-064 | Capacitor apps, A2–C1 depth, professions/exam tracks, wave-3 languages | Per-phase gates | P7 |
