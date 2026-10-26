# Project Status

Last updated: 2026-10-26 (Knowledge Map catch-up paths implemented)

## Current phase
**P2 — learner loop** (in progress). P1 content skeleton is done; its exit (gold unit human-reviewed) is still open. `main` includes PR #77 (`25548d5`) and PR #78 (`8e1b0e5`) and PR #79 (`288a994`). See [roadmap](./ROADMAP.md) and the [task register](./BACKLOG.md).

## Current branch result (DG-048 follow-up)
- PR #77 is merged to `main` as `25548d5`; CI passed foundation, content/type/build, PostgreSQL migration/RLS and attempt/import integration, and Playwright + axe.
- DG-024 adds authenticated `GET /api/progress`, server-re-evaluated idempotent device-history import, and shared progress across Home, Practice, lessons, the map, and You.
- Home explains the next recommended step; DACH scenario missions reuse authored reply-choice exercises and feed the same progress stream. Account progress has eligible/legacy import counts and a JSON download; full GDPR export/audit is still DG-028.
- PR #78 is merged as `8e1b0e5`. It adds a Review Room board, an original-text Library with contextual word lookup and local vocabulary scheduling, Route Studio for choosing/reordering/skipping the active learning line, and a guided study-plan wizard. CI passed all four job groups, including Playwright and axe.
- PR #79 is merged as `288a994`. Lessons store a device-local checkpoint with the remaining steps, retries, session answers, and active time. Home offers a localized resume action; completion and Clear device data remove it. CI passed all four job groups.
- PR #80 is merged as `a0e8e40`. It adds the `categorize` exercise end to end, including partial scoring and per-item feedback. CI passed all four job groups.
- PRs #81–#85 add browser-voiced listening, dictation, error correction, and minimal-pair exercises. The evaluator is at version 1.5.0.
- PR #86 adds Writing Studio at `/{lang}/writing`: localized A1–A2 prompts, device-local drafts, word count, and self-review without automated scoring.
- PR #87 adds the Speaking workshop at `/{lang}/speaking`, with optional local recording and no pronunciation score. PRs #88–#107 complete 34 of the 35 catalogue formats; PR #107 adds syllable stress marking. PR #108 adds an illustrated picture-writing prompt and updates the interactive gallery to cover all 35 currently supported lesson formats.
- Writing Studio now includes an illustrated A1 picture prompt. Drafts and self-review stay on the device; the prompt is not graded and does not create mastery evidence.
- Library screens: `/{lang}/library`, `/{lang}/library/{storyId}`, and `/{lang}/vocabulary`. UI strings exist in en/uk/ru/ar. Vocabulary stays on this device pending DG-050's lexicon/saved-sense contract and account API.
- Route Studio at `/{lang}/routes` stores route choice and order locally; it drives the Home line and next-step recommendation. Lesson evidence remains shared, and skipped topics stay available in the map.
- The wizard at `/{lang}/start` selects a goal, daily time, and learning route in three steps. Its optional five-question check stores a rough A0/A1 estimate locally and suggests a route without locking the learner in. Calibration and region selection remain planned.
- The interactive all-app mockup is `docs/product/mockups/app-review-prototype.html`; its screen map and boundaries are described in [the product blueprint](../product/APP_FUNCTIONAL_BLUEPRINT.md).
- Screen paths and behavior are in [SCREEN_MAP.md](../product/SCREEN_MAP.md); flow definitions are in [USER_FLOWS.md](../product/USER_FLOWS.md); mockups cover Home, Practice, Mission, Progress, Review, Library, and Vocabulary.

## Implemented (on `main`)
- Content contract v1: JSON Schemas, strict YAML loader, semantic validator, bundle compiler, answer evaluator (single choice, word order, cloze, transform), graph utilities (`packages/content-kit`).
- Content: A1 graph mapped (DG-012): 69 concepts total, 54 A1 concepts `planned` and 5 authored as `needs_review`; five A1 lesson units are available across 2 A1 routes. The V2 gold unit, regular-present lesson, W-question lesson, yes/no-question lesson, and imperative lesson still need human review. `npm run content:report`.
- Learning engine v1 (`packages/learning-engine`, DG-010): states, review scheduler, explainable recommendations.
- Attempt recording (`packages/attempts`, `POST /api/attempts`, DG-009): server re-evaluation, append-only events, derived caches.
- Learner-data schema (`supabase/migrations` 0001, 0002): RLS on every table, GDPR export function, cascade deletion. Hosted project `deutschgo` (EU) exists; 0001 is recorded as applied, 0002 (push subscriptions) is not recorded.
- Interface localization (`packages/i18n`, DG-014): en pivot, uk, ru, ar preview (RTL).
- Web app: start screen and plan, lesson as a guided run, knowledge map with search, practice list, learner area, delete device data, installable PWA with offline reading, phone layout with 44px targets (DG-016…DG-019).
- Learner loop: DG-021 review scheduling, DG-022 shared event identity and retry outbox, and DG-024 account read/import across Home, Practice, lessons, map, and profile. DG-048's Review Room is implemented in merged PR #78.
- Sign-in code (DG-015, ADR-0013): Google/Apple via Supabase Auth with PKCE, HttpOnly cookie, 16+ confirmation, account deletion, attempts saved to the account when signed in. **Not configured**: needs the owner steps in [ACCOUNTS_SETUP.md](./ACCOUNTS_SETUP.md).
- Session refresh (DG-025, #52, ADR-0013): access and refresh tokens in separate HttpOnly cookies, rotation at app start, one retry of a rejected attempt after rotation. Needs the same owner setup as sign-in.
- Motivation (DG-020, ADR-0014/0015): signed-in XP/streak use merged account/device evidence; hearts remain device-local; daily push reminder code. **Push not configured**: [REMINDERS_SETUP.md](./REMINDERS_SETUP.md).
- Quality gates in CI: foundation check, content validation, unit tests, typecheck, build, Playwright + axe on desktop and phone, PostgreSQL migration/RLS tests and the attempt integration test.

## Checks run on 2026-10-22 (audit, local Windows, Node 22.14)
Foundation check (passes without `node_modules`; with dependencies installed it fails on third-party READMEs, DG-011), content validation (0 errors/warnings), typecheck, `npm test` (253 tests, 0 failures) and `npm run build` **passed**. `npm run test:db` and E2E were **not run here** (no PostgreSQL/Docker, no Playwright browser); they run in CI. CI status of `e99c7f9` was not verified (no `gh` CLI). Details: [audit §2](./PROJECT_AUDIT_2026-10-22.md#2-checks-run-for-this-audit).

## Known gaps that block the P2 exit
- The cross-device read/import path is now on `main`; provider credentials still need owner setup before production account sync can be exercised.
- Session refresh (#52) and JWKS token verification (DG-026) are implemented; a configured provider round trip still needs owner setup.
- The offline outbox retries browser sends (DG-022). IndexedDB and batched sync remain open as DG-023.
- No rate limiting, monitoring, analytics, backups with restore test, privacy notice or Impressum (DG-027, DG-031…DG-033, DG-030).
- Goals, time budget and region use different vocabularies in the app, the database and the content (DG-029).

## Authored but NOT human-verified
- German correctness and pedagogy of the gold unit and the new regular-present lesson (`review.*: pending`).
- uk/ru translations (0 of 210 localization files reviewed) and the uk/ru/ar interface strings: machine drafts.
- Rights confirmation for original content (owner).

## Not implemented (product scope, later phases)
Email sign-in; complete lexicon and synced saved senses; additional reviewed reading content; recorded audio assets; calibrated placement beyond the five-question pilot; account-synced route preferences; prerequisite catch-up; the engine-managed, human-reviewed picture-prompt exercise (the local-only writing prompt is available in Writing Studio); Arabic font; billing (free during build-out by decision).

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
Broaden the first A0/A1 route with reviewed lessons that use the expanded exercise formats. Then continue with DG-028's complete export/audit path, profile sync, the P4 lexicon contract, and remaining privacy/operations gates.

## Latest implementation — picture-writing journey
- PR #108 adds an original A1 market illustration and localized picture prompt to Writing Studio. Drafts remain local and ungraded.
- The interactive prototype now lists all 35 current lesson-engine formats once each and shows the picture prompt in the writing board.
- PR #109 adds a browser journey for the picture, German draft persistence after reload, and the no-mastery-event boundary.

## Next implementation block — expand the first A0/A1 route
- Add reviewed lessons that use the expanded exercise formats, prioritizing a complete and coherent first learning line.
- Keep the human-reviewed catalogue format out of automatic mastery scoring until a review workflow exists.

## Latest implementation — contextual Dictionary screen
- Added `/{lang}/dictionary`, linked from the Library and from a selected word in a story. It searches the authored reading collection by German form, lemma, or localized meaning; shows its original sentence and source; and saves the exact token occurrence into the existing local vocabulary review schedule.
- Added localized interface strings for en/uk/ru/ar and documented the route and flow. Dictionary breadth grows with reviewed reading entries; it does not invent meanings or claim a complete external dictionary.

## Latest implementation — device data export
- The profile's data card now downloads a versioned JSON snapshot of this browser's DeutschGo state before deletion. It includes app-owned local storage entries such as route preferences, lesson answers/checkpoints, vocabulary, and writing drafts; it is created in the browser and is not uploaded.

## Latest implementation — Knowledge Map catch-up paths
- The map can now expand the unmet prerequisite chain for a target concept, sort it from earliest prerequisite to target, and link directly to the first available lesson. Progress updates shorten the path; planned topics stay visible as blockers and do not lock access to the target.
- Search, level/type/state filters and this catch-up flow are localized in en/uk/ru/ar.

## Latest implementation — first visit funnel
- PR #110 merged as `b89b593`. First-time language choices open the study-plan wizard before Home; returning learners with a saved plan, answer history, or an unfinished lesson go directly to their language Home.
- Desktop and phone journeys now cover language choice → plan → first lesson; the full GitHub Actions run, including Playwright and axe, passed.
- Updated the user-flow and screen-map docs to show this entry and return behavior.
- Home recommendations skip planned route topics without lessons and point to the next available lesson or review; the planned topics stay visible on the line and map.
- The A1 sentence route now begins with a regular-present lesson, followed by the V2 lesson. The new 9-exercise draft uses 8 supported formats; it remains `needs_review` and is never described as human-verified.
- The existing W-question step now resolves to a 9-exercise lesson in 8 supported formats. It follows the route's present-tense and V2 lessons and remains `needs_review`; English copy is draft and Russian/Ukrainian translations are machine drafts.
- The yes/no-question step now resolves to a 9-exercise lesson in 8 supported formats, following W-questions. It distinguishes statements, W-questions, and verb-first yes/no questions, and remains `needs_review`.
- The optional imperative step now resolves to a 9-exercise lesson covering common `du`, `ihr`, and formal `Sie` forms, separable prefixes, and polite `bitte` requests. It remains `needs_review`; its English copy is a draft and Russian/Ukrainian translations are machine drafts.
