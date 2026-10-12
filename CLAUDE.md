# DeutschGo — Claude Code Instructions

## Mission
Build DeutschGo: a deep, flexible German-learning system for life, work, and study in Germany, Austria, and Switzerland. Quality of learning and content is the differentiator; never reduce it to a generic flashcard app. We build the complete product in phases — phases order work, they never shrink the design.

## Orient fast (read only what the task needs)
1. [Project status](./docs/development/PROJECT_STATUS.md) and [backlog](./docs/development/BACKLOG.md) — where we are, what is next.
2. Product: [vision](./docs/product/PRODUCT_VISION.md), [functional spec](./docs/product/PRODUCT_SPEC.md), [release stages](./docs/product/RELEASE_STAGES.md), [user flows](./docs/product/USER_FLOWS.md).
3. Content/language: [content contract](./docs/domain/CONTENT_CONTRACT.md), [knowledge model](./docs/domain/KNOWLEDGE_MODEL.md), [content standard](./docs/domain/CONTENT_STANDARD.md), [localization](./docs/domain/LOCALIZATION_POLICY.md), [curriculum](./docs/domain/CURRICULUM_FRAMEWORK.md).
4. Engine/skills: [learning engine](./docs/domain/LEARNING_ENGINE.md), [skills](./docs/domain/SKILLS.md).
5. Technical: [architecture](./docs/architecture/ARCHITECTURE.md), [ADR index](./docs/architecture/decisions/README.md), [data & privacy](./docs/architecture/DATA_AND_PRIVACY.md), [quality gates](./docs/quality/QUALITY_GATES.md).
Do not load all docs or all content files by default.

## Repository map
- `content/` — YAML: concepts, units, routes, `i18n/<lang>/`, `languages.yaml`, `sources.yaml`. Never learner data.
- `packages/content-kit/` — schemas, loader, validator, compiler, evaluator (pure TS, `node:test`).
- `packages/learning-engine/` — evidence → states → schedule → recommendations (pure TS, `node:test`).
- `supabase/` — learner-data migrations and RLS tests (`npm run test:db`); never content.
- `apps/web/` — Next.js app; reads `generated/content.json`; no teaching text in components.
- `docs/` — canonical decisions; `scripts/check_foundation.py` — doc/link check.

## Commands
`npm run check` (everything) · `npm run test:db` · `npm run content:validate` · `npm test` · `npm run typecheck` · `npm run build` · `python3 scripts/check_foundation.py`

## Non-negotiable principles
1. Separate language knowledge, curriculum, content, learner state, localization, and UI code.
2. Follow accepted ADRs; propose a new/superseding ADR instead of silently deviating.
3. Never present mock, planned, unreviewed, or machine-translated material as finished; keep UI labels honest.
4. Never set content `approved`/`published` or l10n `reviewed` without a recorded human review.
5. No bulk content before the gold unit is human-reviewed; afterwards batches ≤ review capacity.
6. Verify rights before using external material; only `approved` sources in `content/sources.yaml`.
7. Never commit secrets or real learner data (the repository is public).
8. Small, reversible, tested changes; preserve working behaviour.

## Task procedure
1. Read the issue + relevant docs; restate acceptance criteria.
2. Short plan for non-trivial work; check dependencies and adjacent tests.
3. Implement the smallest complete slice; add/adjust tests and docs.
4. Run focused checks, then `npm run check` where practical.
5. Review the diff for scope creep, secrets, broken links.
6. Report: result · files changed · checks actually run + outcome · unverified risks · next task. Never claim an unrun check passed.

## Git
Dedicated branch per task (`feat/`, `fix/`, `docs/`, `content/`, `chore/`); PR with evidence; no direct commits to `main`, no force-push, no history rewrite, no visibility change, no production deploy/migration/billing change without explicit owner authorization.

## Token discipline
Docs are the record, not chat. Link instead of copying specs. Search symbols instead of opening large files. Use `.claude/skills/` for repeated workflows. Update PROJECT_STATUS/BACKLOG when state changes.
