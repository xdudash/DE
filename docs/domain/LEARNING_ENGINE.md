# Learning Engine

Status: **Accepted** design (2026-10-12). v1 algorithms are deliberately simple, deterministic, and explainable; they are replaced only with evidence.

## Goals
Help learners know what they can use reliably, what to practise next and why, and how to study a chosen topic without ignoring prerequisites.

## Evidence (append-only events)
| Event | Produced by | Meaning |
|---|---|---|
| `exposure` | opening a block/unit | saw the material (not learning evidence) |
| `attempt` | exercise submission | response + evaluation result + signalled concepts |
| `recall` | review session (DG-048) | retrieval after a delay (success / again). Any graded result given while the concept is due also counts as a review ([ADR-0016](../architecture/decisions/ADR-0016-review-evidence.md)) |
| `transfer` | exercise in a different unit/skill/context | applied knowledge elsewhere |
| `self_report` | learner marks "I know this" / "too hard" | weak evidence, never mastery alone |

Each event: learner, timestamp (client + server), content id + local id + content version, concept ids, skill, result, evaluator version. Events are immutable; states are **derived** and recomputable (makes sync conflicts and algorithm changes safe).

## Concept states (v1) — implemented in `packages/learning-engine` (DG-010)
States are recomputed from the full event list (order-independent; events after `now` ignored). Precedence, first match wins:

| # | Condition | State | `because` |
|---|---|---|---|
| 1 | no evidence (self-reports alone don't count); all direct prerequisites in progress or better with ≥1 correct result | `available` | `prerequisites_met` |
| 1 | no evidence otherwise | `unseen` | `no_evidence` |
| 2 | ≥3 graded results and accuracy of the last 5 < 70 % | `needs_practice` | `low_recent_accuracy` |
| 3 | ≥2 failed results (any unit) whose error rule **signals** this concept within 7 days | `needs_practice` | `repeated_signalled_error` |
| 4 | review schedule exists and `now ≥ dueAt` | `review_due` | `review_overdue` |
| 5 | ≥2 successful reviews ≥1 day apart and the latest review succeeded (review = explicit recall or a graded result given while due, ADR-0016) | `provisionally_mastered` | `delayed_recall_confirmed` |
| 6 | otherwise (exposure or practice) | `in_progress` | `practising` |

Graded results = `attempt`, `recall`, `transfer` with a boolean result. Mastery is never permanent: due reviews, failed recalls, or new errors move a concept back. Constants live in `states.ts` / `scheduler.ts`; changing them requires updating this table and the fixture tests.

## Mastery estimate (v1)
A transparent score per concept: weighted recent accuracy (attempts) × recall factor × transfer bonus, bucketed into the states above. Shown to learners as states with the evidence ("3 of 4 correct, last review 5 days ago"), not as a fake-precise percentage.

## Recommendation order (v1)
1. Respect the learner's current request and goal.
2. If a requested topic has unmet `depends_on` prerequisites in state unseen/needs_practice, offer a catch-up (never block).
3. Due reviews (capped by the learner's daily budget).
4. Concepts recently signalled by errors.
5. Next step of the active route.
6. Every recommendation carries a reason code (`requested`, `prerequisite_of` + ref, `review_due`, `frequent_error`, `route_next`) rendered in the explanation language; the learner can dismiss/override. Catch-up lists transitive prerequisite gaps foundations-first; reviews are capped by the learner's budget, most overdue first; route_next prefers required over optional steps; targets are never duplicated. `goal_match` is deferred until concepts carry goal tags.

## Spaced repetition
- v1 (implemented, DG-010; reviews per ADR-0016, DG-021): fixed expanding intervals 1, 3, 7, 16, 35 days. The schedule starts at the first correct graded result. A **review** is an explicit recall or any graded result given at or after the due date; a successful on-time review advances one step (early explicit recalls give no credit); a failed review ("again") resets to 1 day from the failure; results before the due date that are not explicit recalls do not move the schedule (they affect state via accuracy). The first answer of a session moves the due date, so later answers in the same session are practice. `ENGINE_VERSION` 1.1.0.
- v2 (P6): FSRS-class scheduler (open-source algorithm, MIT-licensed implementations exist; verify license at adoption) once enough review history exists; A/B against v1 on recall outcomes.
- Review units: vocabulary **senses** (not bare words), concepts (via exercise variants), phrases/collocations.

## Diagnostics
- Placement (P4): adaptive item bank tagged by concept and level; outputs an estimated band with uncertainty, never an official CEFR level; editable by the learner; diagnostic version stored.
- Continuous diagnosis: error rules' `signals` link mistakes to concepts.

## Four skills
Skill progress is tracked only where a real activity measures it; see [skills](./SKILLS.md).

## Personalisation and privacy
No black-box models in v1. Any future ML must be explainable at the recommendation level, opt-out capable, and trained only on consented, minimised data ([data & privacy](../architecture/DATA_AND_PRIVACY.md)).
