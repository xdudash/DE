---
name: create-lesson
description: Draft or revise DeutschGo lessons (units) and the concepts they teach, alone or in a batch, to the lesson standard, with scripts/lesson_builder.py and the validator's lesson norms.
---
# Create or revise lessons

1. Read [`docs/domain/LESSON_PRODUCTION_PLAN.md`](../../../docs/domain/LESSON_PRODUCTION_PLAN.md) (pipeline, owner rules) and the "Lesson standard (A0)" section of [`docs/domain/CONTENT_STANDARD.md`](../../../docs/domain/CONTENT_STANDARD.md). For the YAML contract, `docs/domain/CONTENT_CONTRACT.md`. Do not read other lessons unless needed; the batch reference lesson is `content/units/lexicon/unit.lex.a0_0113_begruessung_hallo_guten_tag.yaml`.
2. Take the lessons from the subtopic plan (A0: `docs/domain/A0_SUBTOPICS_PROPOSAL.md`): one subtopic per lesson, a unique content title, the concepts it teaches, and the earlier lessons it relies on.
3. Author each concept first (`needs_review`, en/uk/ru). A `planned` concept gets `introduced` at the lesson's level; keep its relations.
4. Write one spec per lesson for `scripts/lesson_builder.py` (see its docstring; specs are not committed). The builder writes the unit YAML and the en (draft), uk and ru (machine_draft) files, and computes `estimated_minutes`.
   - 15–25 exercises, 6+ types, never two of a type next to each other, never three option lists or three text boxes in a row, the same question wording at most twice.
   - Every wrong option has its own feedback (`fb`); every true/false item has `wrong`; error `rules` for typical misspellings.
   - At least five examples; German the learner has not met yet only as a glossed chunk, named in `pedagogical_notes`.
   - Rewriting an existing lesson: keep its id, raise `version`.
5. `status: needs_review` at most; all review records `pending`. Sources: `src.deutschgo_original` or an approved source.
6. Run `npm run content:validate`. Zero errors and zero warnings for the new files; the lesson norms are errors.
7. Run the `review-content` skill on at least one lesson in ten, by an agent that did not write it; fix the findings across the batch.
8. Add the lessons to the route in plan order.
9. Report: ids, files, validator summary, review findings, what still needs a human (German, pedagogy, uk/ru review, rights).
