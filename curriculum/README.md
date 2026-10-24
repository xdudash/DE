# DeutschGo curriculum

Status: **planned**. This folder is the course plan from A0 to C2 (ADR-0018). The course teaches general German first; regional German (Austria, Switzerland) is planned for later (ADR-0020). It contains the order of topics, the lesson chain and the word counts. It contains no teaching text. Every lesson is still to be written and reviewed.

## Levels
| Level | Lessons | New words per lesson | Review words per lesson | Topics | Scenarios |
|---|---|---|---|---|---|
| [A0](./A0/README.md) | 150 | 5 | 3 | 25 | 5 |
| [A1](./A1/README.md) | 600 | 8 | 6 | 41 | 8 |
| [A2](./A2/README.md) | 750 | 9 | 7 | 27 | 11 |
| [B1](./B1/README.md) | 1000 | 10 | 8 | 21 | 9 |
| [B2](./B2/README.md) | 1000 | 10 | 8 | 18 | 8 |
| [C1](./C1/README.md) | 1000 | 10 | 8 | 14 | 7 |
| [C2](./C2/README.md) | 500 | 10 | 8 | 13 | 6 |

## One continuous chain
- Lessons are ordered A0.01.01 → C2. Each lesson lists the lesson before it in `Previous`. The first lesson of each level follows the last lesson of the level before.
- Each lesson lists the topics it `Builds on`. A topic may depend only on topics that come earlier in the course. The generator fails if not.
- Every sixth lesson applies what was learned in the lessons before it (scenario lessons).
- Every block ends with a checkpoint that revisits the topics of that block.

## Course tiers (choice by the learner)
The learner chooses how much to take. Tiers select by depth tag, and every tier passes every level:
- **Fast:** core lessons and checkpoints.
- **Medium:** core, standard and checkpoints.
- **Full:** every lesson.

Topics can also be wanted or skipped by the learner (see the app rules in the project docs). A skipped topic removes its lessons only when no wanted lesson depends on it.

## Regenerate
`python3 scripts/curriculum_plan.py` writes all files here from `inventory.json` and `docs/domain/curriculum-skeleton.csv`. `--check` fails if they are stale.

## Caveats
- Topic counts per level are a draft. Above about 12 lessons per topic, the stages repeat; reviewers must write distinct sub-topics before those lessons are authored.
- Word counts are targets for planning. Distinct vocabulary per level is set by the lexicon work (DG-050), not by these numbers.
