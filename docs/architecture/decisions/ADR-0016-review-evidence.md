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
| Trust | The client chooses what counts as mastery evidence | Server decides | Derived from evidence and timestamps only |
| Order independence | Yes | **No**: a late offline event is classified against whatever history had arrived by then; replays could differ | Yes: the full event list is walked in time order on every derivation |
| Device = server | Needs the same flag on both | The device has no server history to classify against | The same pure function runs on both |
| Existing events | Stay attempts forever | Stay attempts forever | Counted retroactively on the next derivation |
| Schema/API change | Request field | `kind` logic in the write path | None |
| A dedicated review screen later (DG-048) | Needs this flag | Needs this flag | Can still emit explicit `recall` events, which keep their meaning |

## Decision
1. **A review is any graded result (attempt, recall, transfer) on a concept given at or after that concept's due date**, plus every explicit `recall` event. The engine decides this while walking the evidence in time order (`reviewHistory` in `packages/learning-engine/src/scheduler.ts`). Stored events keep their `kind`; nothing is rewritten.
2. **Schedule:** a successful review given when due advances one step; a failed review resets to step 0, anchored at the failure; results before the due date that are not explicit recalls do not move the schedule. An early successful explicit recall still gives no credit. Because the first answer after the due date moves the due date forward, **only the first answer of a session counts**; the rest of the session is practice.
3. **Mastery:** `provisionally_mastered` requires ≥ 2 successful reviews at least one day apart, with the latest review successful (same thresholds as before, now reachable). `EvidenceSummary.recalls` and `successfulRecalls` count reviews in this sense; the field names stay for stored `concept_states.evidence` compatibility.
4. `ENGINE_VERSION` becomes `1.1.0`. Cached `concept_states` rows carry the version that wrote them and are recomputed on the next attempt touching the concept, or by `recomputeAll`.

## Consequences
- + Spaced repetition and mastery work with the evidence the app already records, on the device and on the server, without an API, schema or client change.
- + Learners' existing answers count; nothing is migrated.
- + Late or replayed events give the same result as on-time ones.
- − A concept practised in a lesson the day it falls due is reviewed by that lesson. This is intended: retrieval after a delay is the evidence, whatever screen produced it.
- − A multi-concept exercise reviews every concept it is linked to. Exercises link only the concepts they test (CONTENT_CONTRACT), so this matches the content model; precise per-concept attribution is a content concern, not an engine one.
- − `recalls` in stored evidence changes meaning (explicit recalls → reviews). No UI shows the field yet.

## Verification
- `packages/learning-engine/test/scheduler.test.ts`: due attempts advance and reset; one review per session; attempts before the due date are not reviews; review sources; order independence.
- `packages/learning-engine/test/states.test.ts`: mastery from ordinary answers on day 0, 1 and 4; same-day repetition is not proof; a wrong answer while due revokes mastery; the earlier recall-based tests unchanged.
- `packages/attempts/test/service.test.ts`: through `recordAttempt`, three answers on day 0, 1 and 4 return `provisionally_mastered` and the 7-day next review, while the stored events remain `attempt`.
