# DeutschGo Global Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the learner journey coherent across the app by syncing validated progress, explaining next steps, and turning current DACH scenario lessons into guided missions, with full screen flows and mockups.

**Architecture:** Keep content in the compiled bundle, attempt evaluation in the existing attempts package, and account scoping in the existing RLS-backed store. Add one bulk, server-re-evaluated import/read path and a shared client progress source with a local fallback; surface it consistently across Home, Practice, the map, lesson completion, and You. Missions reuse authored `reply_choice` exercises, the same evaluator, and the same event stream.

**Tech Stack:** TypeScript, Next.js 16 App Router, React 19, PostgreSQL/Supabase RLS, Node test runner, existing content-kit and learning-engine packages.

**Spec:** `docs/product/GLOBAL_EXPERIENCE.md`, `docs/product/PRODUCT_SPEC.md`, and `docs/architecture/DATA_AND_PRIVACY.md`.

## Global Constraints

- Preserve `main` as the PR base; all implementation is on `feat/dg-024-global-experience`.
- Use the existing Node engine floor `^22.18.0` and locked dependencies.
- Keep user events append-only, idempotent, re-evaluated by the server, and scoped by learner RLS.
- Don't claim that local data is on the account until a server response confirms it.
- Treat imported answers as occurring on import day; never trust local timestamps for mastery intervals.
- Don't mark unreviewed lessons or translations as human-approved.
- Keep phone targets at least 44px, maintain RTL and keyboard support, and avoid introducing runtime AI or external data providers.

## Review Focus

- Malformed, duplicated, oversized, and mixed-validity imports must write nothing or return a truthful per-item result.
- A server outage or signed-out state must preserve local progress and make no false sync claim.
- Device and account copies with the same event ID count once; server values win conflicts.
- Events for unknown or outdated content cannot be imported into current progress.
- A mission with no reply exercise or missing localization must have a safe empty/fallback state and cannot create a fake answer.

---

### Task 1: Global user flows and screen mockups

**Files:**
- Create: `docs/product/GLOBAL_EXPERIENCE.md`
- Create: `docs/product/mockups/home.svg`
- Create: `docs/product/mockups/practice.svg`
- Create: `docs/product/mockups/progress.svg`
- Modify: `docs/product/USER_FLOWS.md`
- Modify: `docs/product/VISUAL_SYSTEM.md`

**Interfaces:**
- Produces: accepted app-wide screen map, interaction states, and design reference for Tasks 2–4.

- [x] Review each current route and document the full supported learner path plus explicitly gated future paths.
- [x] Add screen mockups for Home, Practice, Progress, and a full mission and link them from the experience blueprint.
- [x] Update user flows to describe account sync/import, recommendation reasons, and mission mode.
- [x] Verify SVG XML and internal Markdown links with `npm run foundation`.

### Task 2: Validated bulk import and account progress endpoint

**Files:**
- Modify: `packages/attempts/src/types.ts`
- Modify: `packages/attempts/src/service.ts`
- Modify: `packages/attempts/src/memory-store.ts`
- Modify: `packages/attempts/test/service.test.ts`
- Create: `apps/web/lib/progress/handler.ts`
- Create: `apps/web/test/progress-handler.test.ts`
- Modify: `apps/web/lib/data/attempt-store.ts`
- Create: `apps/web/app/api/progress/route.ts`
- Create: `apps/web/app/api/progress/import/route.ts`

**Interfaces:**
- `Store.insertEvents(events: StoredEvent[]): Promise<number>` inserts unique rows and returns the inserted count.
- `importAttempts(requests, deps)` validates and re-evaluates every answer, inserts once, derives once, and returns imported/replayed counts plus the current event projection.
- `GET /api/progress` returns `{ events }` with `cache-control: no-store` after session verification.
- `POST /api/progress/import` accepts at most 2,000 candidate device events; all rows validate before any insert.

- [x] Add tests proving a malformed item rejects the entire import without writes, accepted responses are re-evaluated, duplicates are idempotent, and old client timestamps do not advance review history.
- [x] Run the new service tests and observe the expected failures.
- [x] Implement batched Postgres insertion under the learner's RLS session and one derived-state recomputation.
- [x] Add read/import route handler tests for method, auth, missing storage, invalid content, and success.
- [x] Run focused package and handler tests; SQL integration coverage is added but requires PostgreSQL to execute.

### Task 3: Shared progress across Home, Practice, Map, lessons, and You

**Files:**
- Create: `apps/web/lib/progress/client.tsx`
- Create: `apps/web/components/ProgressSyncStatus.tsx`
- Modify: `apps/web/app/[lang]/layout.tsx`
- Modify: `apps/web/components/LinePath.tsx`
- Modify: `apps/web/components/DailyGoal.tsx`
- Modify: `apps/web/components/PracticeList.tsx`
- Modify: `apps/web/components/ConceptMap.tsx`
- Modify: `apps/web/components/ProgressPanel.tsx`
- Modify: `apps/web/components/Motivation.tsx`
- Modify: `apps/web/components/LessonFlow.tsx`
- Modify: `apps/web/components/ExercisePlayer.tsx`
- Modify: `apps/web/components/OutboxSync.tsx`
- Modify: `apps/web/components/AccountPanel.tsx`
- Modify: `apps/web/lib/device-state.ts`
- Modify: `packages/i18n/src/catalogs/{en,uk,ru,ar}.ts`
- Modify: `apps/web/test/device-state.test.ts`
- Create: `apps/web/test/progress-client.test.ts`

**Interfaces:**
- `ProgressProvider` exposes `{ attempts, source, syncState, remoteEventIds, refresh }`.
- `source` is `device | account`; `syncState` is `loading | synced | offline | signed_out`.
- `DeviceAttempt.response` is optional for backwards compatibility and stored only on this device until server re-evaluation.

- [x] Test response retention, event-ID de-duplication, and backward-compatible local events.
- [x] Implement the shared provider: initial local state, no-store server fetch, pathname/focus refresh, local storage events, server save notification, and no request loop on local-only updates.
- [x] Replace per-screen reads with the shared attempt stream so all views update from the same events.
- [x] Add an explicit import control on You, including eligible and ineligible counts, loading, error handling, and successful refresh.
- [x] Add localized sync, import, and limitation copy in all interface catalogs.
- [x] Run focused tests, typecheck, and the production build. Hosted CI passed Playwright + axe after correcting six stale UI expectations and two journey-test assumptions.

### Task 4: Explainable next step and practical DACH missions

**Files:**
- Create: `apps/web/components/NextStepCard.tsx`
- Create: `apps/web/components/MissionList.tsx`
- Create: `apps/web/app/[lang]/mission/[unitId]/page.tsx`
- Modify: `apps/web/app/[lang]/page.tsx`
- Modify: `apps/web/app/[lang]/practice/page.tsx`
- Modify: `packages/i18n/src/catalogs/{en,uk,ru,ar}.ts`
- Modify: `apps/web/test/locale-parity.test.ts` if new keys require it.
- Create: `apps/web/e2e/missions.spec.ts`

**Interfaces:**
- Next-step card consumes the shared progress stream, compiled graph, and active route; it shows one target and the exact recommendation reason.
- Mission list consumes the compiled bundle and includes only units containing real `reply_choice` exercises.
- Mission route passes those exercises to the existing `LessonFlow` and server-side attempt evaluator; it never authors or fabricates teaching text.

- [x] Add a mission-discovery test for reply-choice content.
- [x] Implement a Home next-step card with a direct route and a human-readable reason; learner can still choose the line or map.
- [x] Add DACH mission cards to Home and Practice and a focused conversation path from authored reply exercises.
- [x] Connect mission answers to the shared progress stream used by Home, Practice, the Knowledge map, and You.
- [x] Run focused unit tests, content validation, typecheck, and build. Accessibility and phone E2E checks require the CI/browser environment.

## Final verification

- [x] `npm run check`
- [x] CI PostgreSQL migration/RLS and attempt/import integration checks.
- [x] Hosted Playwright + axe passed after fixing stale UI expectations and journey-test assumptions.
- [x] `git diff --check`; local browser startup is blocked by the sandbox network interface error, so browser journeys ran in CI.
