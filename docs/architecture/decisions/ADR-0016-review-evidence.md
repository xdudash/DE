# ADR-0016: Answers given while a review is due count as reviews

- Status: Accepted (DG-021)
- Date: 2026-10-22
- Decision owner: Project owner (technical decision within LEARNING_ENGINE.md; owner informed)

## Context
The learning engine v1 ([learning engine](../../domain/LEARNING_ENGINE.md)) advances the review schedule only on `recall` events, and grants `provisionally_mastered` only after two successful recalls at least a day apart. No producer of `recall` events exists: the lesson, the practice list and `POST /api/attempts` all record `attempt` (`packages/attempts/src/service.ts`, `apps/web/lib/device-state.ts`). In the running app, a schedule therefore stays at its first 1-day step forever, and no concept can be mastered ([audit](../../development/PROJECT_AUDIT_2026-10-22.md), finding E1).

Constraints: events are append-only and states are recomputed from them (ADR-0010, DATA_AND_PRIVACY); the client's verdict is never trusted; events can arrive late and out of order once the offline queue exists (DG-023); device and server must derive the same state from the same evidence (DG-024).

## Options considered
| | A. Client declares a review (`mode: review` in the request) | B. Server classifies at write time (stores `kind = recall` if the concept was due) | C. Engine classifies at derivation time (chosen) |
|---|---|---|---|
| Trust | The client chooses what counts as mastery evidence | Server decides | Derived from evidence and timestamps; the server bounds how far a client may backdate an answer (decision 5) |
| Order independence | Yes | **No**: a late offline event is classified against whatever history had arrived by then; replays could differ | Yes: the full event list is walked in time order on every derivation |
| Device = server | Needs the same flag on both | The device has no server history to classify against | The same pure function runs on both |
| Existing events | Stay attempts forever | Stay attempts forever | Counted retroactively on the next derivation |
| Schema/API change | Request field | `kind` logic in the write path | None |
| A dedicated review screen later (DG-048) | Needs this flag | Needs this flag | Can still emit explicit `recall` events, which keep their meaning |

## Decision
1. **A review is any graded result (attempt, recall, transfer) on a concept given at or after that concept's due date**, plus a failed explicit `recall` at any time. The engine decides this while walking the evidence in time order (`reviewHistory` in `packages/learning-engine/src/scheduler.ts`). Stored events keep their `kind`; nothing is rewritten.
2. **Schedule:** a successful review given when due advances one step; a failed review resets to step 0, anchored at the failure; other results before the due date do not move the schedule. An early successful explicit recall is not a review at all (no step, no mastery credit). Because the first answer after the due date moves the due date forward, **only the first answer of a session counts** for each concept; the rest of the session is practice. Results with the same timestamp are taken wrong-first, so a tie never earns credit.
3. **Mastery:** `provisionally_mastered` requires ≥ 2 successful reviews at least one day apart, with the latest review successful (same thresholds as before, now reachable). `EvidenceSummary.recalls` and `successfulRecalls` count reviews in this sense; the field names stay for stored `concept_states.evidence` compatibility.
4. `ENGINE_VERSION` becomes `1.1.0`. Cached `concept_states` rows carry the version that wrote them and are recomputed on the next attempt touching the concept (`recomputeAll` exists but nothing calls it yet; the app does not read the caches before DG-024).
5. **Answer times are bounded.** Since timestamps now decide reviews, the server clamps a client's `occurredAt` into `[received − 15 min, received]` (`MAX_CLIENT_LAG_MS`, `packages/attempts/src/service.ts`). Answers are sent as they are given, so this covers slow networks and retries. The offline queue (DG-023) must replace it with an explicit rule for answers that waited on the device; until then a queued answer is dated at most 15 minutes before it arrives.
6. **Answers carry the concepts of the exercise**, not of the whole unit, on the device as on the server (`ExercisePlayer.tsx` records `exercise.concepts`). Earlier device events tagged with all unit concepts stay as stored; the only authored unit has one concept, so no learner is affected.

## Consequences
- + Spaced repetition and mastery work with the evidence the app already records, on the device and on the server, without an API, schema or client change.
- + Learners' existing answers count; nothing is migrated.
- + Late or replayed events give the same result as on-time ones.
- − A concept practised in a lesson the day it falls due is reviewed by that lesson. This is intended: retrieval after a delay is the evidence, whatever screen produced it.
- − An exercise linked to several concepts reviews each of them. Exercises should link only the concepts they test (CONTENT_CONTRACT); content review checks this.
- − One slip on the first due answer resets even a 16- or 35-day interval to 1 day, and correct answers later in that session earn nothing. This is the v1 "again" rule, now applied to ordinary answers; graded recall quality belongs to the FSRS-class scheduler (P6).
- − After a reset, one correct review the next day restores mastery, because the earlier successful reviews still count. Accepted for v1; revisit with the review session (DG-048).
- − The device still records no error-rule `signals`, so `needs_practice` from signalled errors appears only in server state. Parity follows with one event identity (DG-022).
- − `recalls` in stored evidence changes meaning (explicit recalls → reviews). No UI shows the field yet; rename it at the next evidence-format change.

## Verification
- `packages/learning-engine/test/scheduler.test.ts`: due attempts advance and reset; one review per session; attempts before the due date are not reviews; early recalls and transfers do not open a review; ties are wrong-first; review sources; order independence.
- `packages/learning-engine/test/states.test.ts`: mastery from ordinary answers on day 0, 1 and 4; same-day repetition is not proof; a wrong answer while due turns mastery into `in_progress`; an early explicit recall earns no credit; a multi-concept answer reviews each concept; the earlier recall-based tests unchanged.
- `packages/attempts/test/service.test.ts`: through `recordAttempt`, three answers on day 0, 1 and 4 return `provisionally_mastered` and the 7-day next review while stored events remain `attempt`; backdating beyond 15 minutes is clamped and fakes no review.
- An independent agent review of the first version found no blockers; its findings (device concepts, backdating, early-recall credit, ties, a weak test, doc drift) are addressed above.
