# Learning Engine

Status: **Accepted** design (2026-10-12). v1 algorithms are deliberately simple, deterministic, and explainable; they are replaced only with evidence.

## Goals
Help learners know what they can use reliably, what to practise next and why, and how to study a chosen topic without ignoring prerequisites.

## Evidence (append-only events)
| Event | Produced by | Meaning |
|---|---|---|
| `exposure` | opening a block/unit | saw the material (not learning evidence) |
| `attempt` | exercise submission | response + evaluation result + signalled concepts |
| `recall` | review session | retrieval after a delay (success / again) |
| `transfer` | exercise in a different unit/skill/context | applied knowledge elsewhere |
| `self_report` | learner marks "I know this" / "too hard" | weak evidence, never mastery alone |

Each event: learner, timestamp (client + server), content id + local id + content version, concept ids, skill, result, evaluator version. Events are immutable; states are **derived** and recomputable (makes sync conflicts and algorithm changes safe).

## Concept states (v1)
```text
unseen ──open──► in_progress ──≥1 correct attempt in each objective──► needs_practice?──►
          │                                                     │
          └ prerequisites met → "available"                     ▼
                                       provisionally_mastered ◄── ≥2 successful delayed recalls
                                                     │                 (≥1 day apart)
                                                     └─ due date passed ─► review_due
```
- `needs_practice`: accuracy < 70 % over the last 5 attempts or a signalled error ≥2 times in 7 days.
- `provisionally_mastered` never becomes permanent: later errors move it back.
- Exact transition rules are implemented as a pure function with fixture tests before any learner data is collected (P2 task).

## Mastery estimate (v1)
A transparent score per concept: weighted recent accuracy (attempts) × recall factor × transfer bonus, bucketed into the states above. Shown to learners as states with the evidence ("3 of 4 correct, last review 5 days ago"), not as a fake-precise percentage.

## Recommendation order (v1)
1. Respect the learner's current request and goal.
2. If a requested topic has unmet `depends_on` prerequisites in state unseen/needs_practice, offer a catch-up (never block).
3. Due reviews (capped by the learner's daily budget).
4. Concepts recently signalled by errors.
5. Next step of the active route.
6. Every recommendation carries a reason code (`review_due`, `prerequisite_of:<id>`, `frequent_error`, `route_next`, `goal_match`) rendered in the explanation language; the learner can dismiss/override.

## Spaced repetition
- v1 (P3): fixed expanding intervals (1, 3, 7, 16, 35 days; "again" resets to 1) — testable, explainable.
- v2 (P6): FSRS-class scheduler (open-source algorithm, MIT-licensed implementations exist; verify license at adoption) once enough review history exists; A/B against v1 on recall outcomes.
- Review units: vocabulary **senses** (not bare words), concepts (via exercise variants), phrases/collocations.

## Diagnostics
- Placement (P4): adaptive item bank tagged by concept and level; outputs an estimated band with uncertainty, never an official CEFR level; editable by the learner; diagnostic version stored.
- Continuous diagnosis: error rules' `signals` link mistakes to concepts.

## Four skills
Skill progress is tracked only where a real activity measures it; see [skills](./SKILLS.md).

## Personalisation and privacy
No black-box models in v1. Any future ML must be explainable at the recommendation level, opt-out capable, and trained only on consented, minimised data ([data & privacy](../architecture/DATA_AND_PRIVACY.md)).
