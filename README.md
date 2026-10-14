# DeutschGo

DeutschGo is a deep, flexible German-learning system for people who need German for life, work, and study in Germany, Austria, and Switzerland: a connected model of German, a curriculum from A1 to C1, practice in all four skills, explanations in the learner's language, and honest, evidence-based progress.

## Status
**Phase P1 — content contract & application skeleton.** The content contract, validator, answer evaluator, a gold-standard unit (V2 word order; not yet human-reviewed), and a Next.js skeleton exist and are checked in CI. Accounts, persistence, and the learning engine come next. Details: [project status](./docs/development/PROJECT_STATUS.md).

## Quick start
Requires Node.js ≥ 22.18 and Python 3 (for the doc check).
```bash
npm install
npm run content:validate     # validate all content, show language coverage
npm test                     # content-kit tests
npm run dev -w @deutschgo/web  # http://localhost:3000 (builds the content bundle first)
npm run check                # everything CI runs
```

## Documentation
| Area | Start here |
|---|---|
| Product | [Vision](./docs/product/PRODUCT_VISION.md) · [Functional spec](./docs/product/PRODUCT_SPEC.md) · [Release stages](./docs/product/RELEASE_STAGES.md) · [Monetization](./docs/product/MONETIZATION.md) · [User flows](./docs/product/USER_FLOWS.md) |
| Language & content | [Content contract](./docs/domain/CONTENT_CONTRACT.md) · [Knowledge model](./docs/domain/KNOWLEDGE_MODEL.md) · [Content standard](./docs/domain/CONTENT_STANDARD.md) · [Curriculum](./docs/domain/CURRICULUM_FRAMEWORK.md) · [Localization](./docs/domain/LOCALIZATION_POLICY.md) · [Regional varieties](./docs/domain/REGIONAL_VARIETIES.md) |
| Learning | [Learning engine](./docs/domain/LEARNING_ENGINE.md) · [Four skills](./docs/domain/SKILLS.md) |
| Technical | [Architecture](./docs/architecture/ARCHITECTURE.md) · [ADRs](./docs/architecture/decisions/README.md) · [Data & privacy](./docs/architecture/DATA_AND_PRIVACY.md) |
| Quality | [Quality gates](./docs/quality/QUALITY_GATES.md) · [Content review](./docs/quality/CONTENT_REVIEW.md) · [Operations](./docs/quality/OPERATIONS.md) |
| Work | [Roadmap](./docs/development/ROADMAP.md) · [Backlog](./docs/development/BACKLOG.md) · [Workflow](./docs/development/WORKFLOW.md) · [Sources](./docs/sources/SOURCE_REGISTER.md) |

## Repository layout
```text
CLAUDE.md, .claude/        instructions, scoped rules, skills for Claude Code
docs/                      product, domain, architecture (ADRs), quality, development
content/                   YAML: concepts, units, routes, i18n/<lang>, languages, sources
packages/content-kit/      JSON Schemas, validator, compiler, answer evaluator (TypeScript)
apps/web/                  Next.js web app / PWA
scripts/                   repository checks
.github/                   CI workflow, issue and PR templates
```

## Principles
Committed docs are the source of truth. Content is validated automatically and reviewed by humans; schema-valid is not the same as correct German. Unfinished, unreviewed, or machine-translated material is always labelled. External material only with verified rights.
