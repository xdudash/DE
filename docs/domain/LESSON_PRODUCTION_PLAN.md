# Lesson production plan

Status: working plan, written on the owner's instruction of 2026-10-25 ("create a plan for creating lessons and the standards; take the chat history into account"). The owner can change any part of it. The rules a single lesson must meet are in the [content standard](./CONTENT_STANDARD.md#lesson-standard-a0); this document says how lessons are produced, in what order, and what was learned on the way.

## 1. Goal
A complete course from A0 to C2, about 5000 lessons ([ADR-0018](../architecture/decisions/ADR-0018-curriculum-scale-and-depth-tiers.md), [curriculum framework](./CURRICULUM_FRAMEWORK.md#coverage-matrix-targets-adr-0018)), drafted fast in large batches and reviewed by sampling ([ADR-0021](../architecture/decisions/ADR-0021-batch-drafting-before-gold-review.md)). Quality is not traded for speed: every lesson meets the lesson standard before it is merged, and the validator refuses one that does not.

Order: A0 (150 lessons, 6 blocks of 25) → A1 (600) → A2 → B1 → B2 → C1 → C2. Within A0 the working order is the subtopic list in [A0_SUBTOPICS_PROPOSAL.md](./A0_SUBTOPICS_PROPOSAL.md): one subtopic per lesson, a content title, a checkpoint at the end of each block. The generated `curriculum/A0/lessons.md` predates that list and still uses stage titles ("Übung", "Anwendung"); it is regenerated from the subtopic list later (backlog DG-066).

## 2. What the owner told us, and the rule that came out of it
These rules are binding for every batch. Each one is checked by a tool where a tool can check it.

| When | What happened | Rule now | Checked by |
|---|---|---|---|
| 2026-10-24 | Lessons had 2–3 exercises and a typed "12 minutes" nobody measured. | An A0 lesson has 15–25 exercises and at least 5 new words in examples. Minutes are computed from the exercises, not typed (ADR-0023). | `norm.exercise_count`, `norm.examples`, `norm.minutes_*` |
| 2026-10-24 | Owner asked for about 35 exercise types instead of four. | Types are built in the engine first, then used in lessons (ADR-0023). A lesson uses at least 4 types; in practice 6 or more. | `norm.type_variety` |
| 2026-10-24 | Owner removed "draft / not reviewed" labels for learners before launch. | No review labels for learners until launch; statuses stay in the data (ADR-0022). | e2e test |
| 2026-10-25 | Owner wants big batches, not 10 lessons, and does not want to merge them himself. | 50–100 lessons per PR, all `needs_review`; the agent merges its own PR when CI is green; the owner samples about 5% per level (ADR-0021). | CI |
| 2026-10-25 | "Two exercises of the same kind in a lesson" — the numbers lessons asked "Which word means 30? / 40? / 50?" four times in a row. | Never two exercises of the same type next to each other; never three option lists (or three text boxes) in a row; a type at most a quarter of the lesson; the same question wording at most twice. | `norm.adjacent_type`, `norm.shape_run`, `norm.type_share`, `norm.prompt_template` |
| 2026-10-25 | Drafting agents copied one reference lesson, so every lesson used the same order of exercise types. | Neighbouring lessons on a route share the type at no more than half of the positions. | `norm.route_rhythm` |
| 2026-10-25 | The independent review found the same task under new wording, the same answer three times, over-absolute rules and rejected correct variants. | A type at most three times; the same answer at most twice; the review checklist in the content standard. | `norm.type_share`, `norm.repeated_answer`, review |
| 2026-10-25 | Wrong options all said "Not this one. Read the explanation." | Every wrong option explains its own mistake; a true/false item explains the wrong pick. | `norm.distractor_feedback`, `norm.generic_feedback` |
| 2026-10-25 | Lessons were merged but learners could not reach them. | A lesson is done only when it is on the route, in plan order. | review of the route diff |
| 2026-10-22 | The curriculum generator produced titles such as "Übung 2" several times. | One subtopic per lesson and a unique content title. | `norm.duplicate_title` |
| 2026-10-25 | Concepts were placeholders at A1 while A0 lessons taught them. | Author the concept before the lesson; its `introduced` level is the level of the first lesson that teaches it. | `status.planned_taught` |
| always | uk and ru are written by the AI. | uk and ru are `machine_draft`; only a human marks them `reviewed`. | `l10n` checks |

## 3. The pipeline for one batch
1. **Choose.** Take the next one or two blocks from the subtopic list (a batch of 50–100 lessons is two to four blocks). List for each lesson its subtopic, the concepts it needs and the earlier lessons it relies on. A lesson may only use German that earlier lessons taught; anything else appears as a glossed chunk and is noted in `review.pedagogical.notes`.
2. **Concepts first.** Author every concept the batch teaches (`needs_review`, en/uk/ru strings). A placeholder concept moves to `needs_review` with `introduced` at the batch level.
3. **Write specs.** One spec per lesson for [`scripts/lesson_builder.py`](../../scripts/lesson_builder.py); the builder writes the canonical unit YAML and the en/uk/ru files. Specs are an authoring aid and are not committed: the YAML is the source of truth, and later fixes are made in the YAML. The builder refuses a wrong option without feedback, a true/false item without feedback, and a string missing a language.
4. **Validate.** `npm run content:validate` must report zero errors (the lesson norms are errors). `npm test -w @deutschgo/content-kit` must pass; its repository test fails on any validator error.
5. **Self-review.** Run the `review-content` skill on at least one lesson in ten, chosen across the batch, by an agent that did not write it. Check German, that each item has one defensible answer, distractors, level fit, and the uk/ru wording. Fix what it finds in the whole batch, not only in the sample.
6. **Route.** Add the lessons to the route in plan order.
7. **PR.** One PR per batch. The body lists the lessons, the decisions the owner should confirm, and what was not verified. When every CI check is green, the agent merges (owner instruction, 2026-10-25).
8. **Owner sample.** The owner reads about 5% of each level. A finding becomes a rule here or in the validator first, then the batch is fixed.

## 4. Parallel drafting
A batch can be drafted by up to five agents at once. Each agent owns a disjoint set of files (its units, their l10n files and the concepts it authors). Shared files — the route, the builder, `norms.ts`, the docs — are changed only by the coordinating session, which integrates, validates and reviews before the PR. An agent never runs git.

## 5. Order and progress
| Block | Lessons | State on 2026-10-25 |
|---|---|---|
| A0.01 Aussprache und Begrüßung | 25 | Lesson 1 (alphabet) approved by the owner; lessons 2–25 drafted to the standard in the batch of 2026-10-25 (`needs_review`) |
| A0.02 Zahlen, Zeit und Tage | 25 | 1, 2 and 6 drafted (`needs_review`); the rest next |
| A0.03 Ich und die anderen | 25 | not started |
| A0.04 Essen, Einkaufen und Artikel | 25 | not started |
| A0.05 Orte, Wege und Alltag | 25 | not started |
| A0.06 Zusammenfassung und Anwendung | 25 | not started |

Next batches: A0.02 (rest) and A0.03 together (47 lessons), then A0.04 and A0.05 (50), then A0.06 and the start of A1. Audio types wait for ADR-0019; until then pronunciation lessons work with letters, spellings and example words.

## 6. Definition of done for one lesson
- The validator reports nothing for it (errors and warnings), including the lesson norms.
- en, uk and ru strings exist; uk and ru are `machine_draft`.
- `status: needs_review`, all review records `pending`, with notes on anything a reviewer must check.
- It is on the route in plan order.
- It is listed in the batch PR.

## 7. What agents never do
Approve or publish content, mark a translation `reviewed`, record a human review, or use a source that is not `approved` in `content/sources.yaml`.

## 8. Known limits
- Minutes are an estimate from fixed per-type times ([`norms.ts`](../../packages/content-kit/src/norms.ts)); they are not measured. Calibrate them from real attempt times when learners use the app (DG-067).
- No audio yet, so no listening or dictation exercises and no minimal pairs.
- The validator cannot judge German, pedagogy or translation quality; the review steps in §3 and the owner sample can.
