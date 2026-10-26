# A1 W-Questions Lesson Design

## Intent
Make the next step in the A1 sentence-foundations route teachable after the existing present-tense and V2 lessons. Learners should be able to practise asking for a person, thing, place, time, reason, or amount.

## Goals
- Turn `concept.syntax.w_questions` into an authored A1 concept and add a startable lesson to the existing route step.
- Teach the basic pattern `question word + finite verb + subject + rest`, with a clear note for `wer` as the subject and `wo/wohin/woher` meanings.
- Provide 9 exercises across 8 supported formats and en/ru/uk learner-language copy.
- Advance Home's recommendation past route lessons whose exercises have already all been answered, matching the lesson-state rail.
- Keep German, pedagogy, translation, and rights review states explicit and pending.

## Non-goals
- Add backend, evaluator, schema, route-order, or UI changes. The content-to-route mapping and lesson player already support this lesson.
- Teach case declension of `wer/wen/wem`, subordinate questions, or regional variants.
- Mark any copy or content as human-reviewed.

## Approaches
- **Add a new concept and unit to the current route step, and filter completed lessons from the route recommendation (chosen):** keeps the planned curriculum identity and existing concept-to-unit mapping; aligns the recommendation with the Home rail's answered-all-exercises completion rule.
- Add a standalone route-specific unit step: duplicates curriculum identity and would not make the lesson available consistently to other routes that contain this concept.
- Modify Home or Route Studio to add a one-off W-question mapping: unnecessary because `routeOptionsFromBundle` already resolves a concept step to a matching unit.

## Constraints and calls
- Use the existing YAML content contract and original German examples.
- Preserve `concept.syntax.w_questions` identity and bump its version from `0.1.0` to `1.0.0` when adding authored grammar facts.
- Use `needs_review` for the concept and lesson; English localization remains `draft`, Russian and Ukrainian remain `machine_draft`.
- Filter recommendation steps with the same completion rule as the Home rail: a lesson is complete when it has at least one exercise and all its exercise ids have answers on the device/account progress stream.
- Cover the route recommendation after prior A1 lessons are complete, and verify the lesson can be opened from Home.

## Review boundary
Structural checks prove references, exercise answers, localization coverage, and buildability only. A qualified German teacher, translation reviewers, and the content owner still need to clear their respective review gates.
