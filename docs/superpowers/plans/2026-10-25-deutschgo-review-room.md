# DeutschGo Review Room

## Goal

Turn spaced review into a complete, reachable learner flow with a daily board, a short configurable session, and a result path that uses the same evaluator and progress stream as lessons.

## Screen and user path

1. Open the Review Room from Home's due recommendation or Practice's review panel.
2. See due topics ordered by oldest due time, total due, selected session size, and estimated time.
3. Choose a manageable load (3, 5, or 10) and include or skip individual topics.
4. Start one question per selected topic, using existing authored exercises and answer feedback.
5. Save answers through the existing attempt/outbox path. A correct delayed answer extends the schedule; a wrong answer resets it under ADR-0016.
6. Show the existing arrival summary and return to the board. When no topic is due, show the next scheduled date and a useful route back to Practice.

## Technical plan

- Render due states from merged account/device evidence via `deriveConceptStates`.
- Build a localized exercise bank from current course content on the server; pass only serializable course data to the client.
- Select least-seen eligible exercises first; keep unit id/version attached so the attempt endpoint validates the right authored source.
- Reuse `LessonFlow` and `ExercisePlayer` with a mixed-unit source on each step; use practice mode for review hearts and existing wrong-answer retry behavior.
- Add the Review Room as a route under the existing four-section navigation and surface it from Home and Practice.
- Document the board, session states, and shared scheduler semantics; include a screen-level SVG mockup.

## Acceptance

- Due queue is derived from the same merged evidence shown in the rest of the app and sorted by due time.
- Daily load and per-topic selection control what enters a session; unavailable exercises are identified honestly.
- Every session answer reuses existing local evaluation, server re-evaluation, idempotent storage, offline outbox, and shared progress refresh.
- Incorrect responses follow existing retry rules; spacing transitions stay governed by ADR-0016.
- Empty, loading, no-question, account/device status, and session states render in the learner's selected language and fit phone and RTL layouts.
- No new content is marked reviewed or published.
