# A1 Yes/No Questions Lesson Design

## Intent
Make the next required step in the A1 sentence-foundations route startable after the W-question lesson. Learners should be able to ask simple direct questions that can be answered with *ja* or *nein*.

## Goals
- Author the existing `concept.syntax.v1_yes_no_questions` and attach an A1 lesson to its existing route step.
- Teach the contrast between statements (finite verb in position 2), W-questions (question word first, finite verb second), and yes/no questions (finite verb first).
- Include simple present-tense examples, subject-verb agreement, short answers, and 9 exercises across 8 supported formats.
- Localize the learner-facing copy for en/ru/uk while preserving pending human review.
- Verify Home advances to this lesson after the earlier lessons in the route are complete.

## Non-goals
- Add APIs, database state, schema formats, new exercise types, or route order changes.
- Teach indirect questions, negative-question replies with *doch*, or full modal/separable verb brackets; mention these only as later topics.
- Mark draft German or translations as reviewed.

## Approaches
- **Add a unit to the existing concept step (chosen):** follows the route order and existing concept-to-unit mapping, keeping Home and Route Studio behavior consistent.
- Add a separate route unit step: duplicates the concept already present and can surface inconsistent ordering across routes.
- Add custom Home logic for this topic: unnecessary because the app already resolves authored concept steps to their lesson units.

## Constraints and calls
- Keep the concept and lesson `needs_review`; keep English localization `draft` and RU/UK `machine_draft`.
- Use original German examples and the current YAML content contract.
- Keep examples focused on simple direct present-tense questions; explicitly distinguish the verb-first pattern from W-questions and statements.
- Rely on the route recommendation's existing completed-lesson filtering from the previous change.

## Review boundary
Validation confirms structure and authored answer keys. German correctness, A1 teaching quality, translations, and rights still require their named human reviewers.
