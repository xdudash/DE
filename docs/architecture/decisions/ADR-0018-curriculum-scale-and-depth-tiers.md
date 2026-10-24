# ADR-0018: Curriculum scale (5000 lessons) and depth tiers
- Status: Accepted (owner confirmed 2026-10-23)
- Date: 2026-10-23
- Decision owner: Project owner

## Context
The curriculum framework (CURRICULUM_FRAMEWORK.md) estimated about 60–90 units per CEFR level, around 440 lessons in total including A0 and C2. That is too small for the product goal of a complete course from A0 to C2 that covers life, work and study in DACH. The owner set a target of about 5000 lessons and asked that learners choose a course of a given depth (fast, medium, full). The course should keep a constant lesson structure per level, and depth decides which lessons a learner takes.

## Options considered
1. Keep about 440 lessons and make each lesson longer. Rejected: lessons would exceed the 8–12 minute guideline and would lose the short, guided format of the visual system.
2. Separate course per tier, with its own lessons. Rejected: it duplicates concepts and content, which goes against the separation of knowledge, curriculum and content (CLAUDE.md principle 1).
3. One canonical set of about 5000 lessons, each tagged with a depth. Tiers select subsets. Chosen.

## Decision
- The canonical corpus is 5000 lessons, distributed as follows:

| Level | Lessons | Blocks of about 25 |
|---|---|---|
| A0 (added track, not CEFR) | 150 | 6 |
| A1 | 600 | 24 |
| A2 | 750 | 30 |
| B1 | 1000 | 40 |
| B2 | 1000 | 40 |
| C1 | 1000 | 40 |
| C2 | 500 | 20 |

- Every lesson carries one depth tag: `core` (about 30%, approx. 1500), `standard` (about 40%, approx. 2000), or `deep` (about 30%, approx. 1500).
- Course tiers select by depth: fast = core, medium = core + standard, full = all 5000.
- Every tier passes every level. Each block ends with a checkpoint lesson, and no tier skips a level entirely. Lower tiers reduce depth, not the level.
- Coverage targets in CURRICULUM_FRAMEWORK.md are replaced by these numbers. Concept counts per level are still estimates until authored data exists.
- Publishing is gated by content review (DG-007 and DG-042 onward). Nothing is bulk-generated before the gold unit passes human review, and batches stay within review capacity.

## Consequences
- The scale is multi-year work that depends on human reviewers. The project must not treat the target as a near-term deliverable.
- The schema needs a `depth` field on lessons and a tier-to-depth mapping in the course model. This is a contract change and follows CONTENT_CONTRACT §8 (tracked as DG-046).
- Estimated full-course length is about 800 hours at 10 minutes per lesson. Cost and timeline estimates derive from this.
- Learner progress and the content report must count lessons per tier and per level. The report is generated, not hand-maintained.

## Amendment (2026-10-24): one chain and learner choices
- The course is one chain. Every lesson's `previous` is the lesson before it in `curriculum/course.json`; the first lesson of each level follows the last of the level before. The generator fails if the chain breaks.
- Topics are ordered by dependencies (`builds_on`). A topic may depend only on topics earlier in the course; the generator checks this.
- The learner may mark a topic `want` (its lessons are added whatever the tier) or `skip` (its lessons are removed). A skipped topic that a kept lesson builds on is reported as a conflict, never hidden. Logic: `apps/web/lib/topic-choices.ts`.
- The CEFR enum gains `A0` (schema `common.schema.json`, `Cefr` type, coverage report). This is a contract change under CONTENT_CONTRACT §8; the first A0 entities are `concept.pron.alphabet` and `unit.pron.alphabet_a0`, both `needs_review`.
- Explanation languages: every entity is written for en, uk and ru; the learner reads the one matching their interface language. Wave-2 languages come later.
- Planning output under `curriculum/` is a draft for review. It holds topics and word targets, never teaching text. The app UI for choices is not built yet: it needs reviewed topic names.

## Verification
- Documentation only. No content is added and the validator is unaffected.
- Once DG-046 lands: schema fixtures for `depth`, and a test that every tier includes a checkpoint for each level.
