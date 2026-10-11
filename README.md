# DeutschGo

DeutschGo is a long-term project to build a deep, flexible German-learning system for people who need German for life, work, and study in Germany, Austria, and Switzerland.

It is intended to combine a structured model of German-language knowledge, a high-quality curriculum, flexible learning paths, authentic learning materials, practice across all four skills, and measurable progress.

## Project status

**Phase: product and technical foundation.** This repository is being prepared before large-scale application development or bulk lesson authoring.

Not yet decided: final technology stack, backend/provider choices, hosting, mobile delivery strategy, subscription provider, and production data architecture. These decisions must be documented before implementation depends on them.

## Start here

1. [Claude Code instructions](./CLAUDE.md) — short operating instructions for Claude Code.
2. [Product vision](./docs/product/PRODUCT_VISION.md) — product vision and principles.
3. [MVP scope](./docs/product/MVP_SCOPE.md) — proposed first usable release and explicit non-goals.
4. [Knowledge model](./docs/domain/KNOWLEDGE_MODEL.md) — separate language knowledge, learning content, and learner state.
5. [Content standard](./docs/domain/CONTENT_STANDARD.md) — quality bar for lessons and exercises.
6. [Roadmap](./docs/development/ROADMAP.md) — staged implementation plan.
7. [Development workflow](./docs/development/WORKFLOW.md) — task, branch, test, and review workflow.

## Repository principles

- Treat committed documentation as the project’s shared source of truth; do not rely on chat history as the only record of a decision.
- Keep product/domain rules separate from implementation details.
- Build one complete, testable user journey before expanding breadth.
- Use small, reviewable changes and automated checks.
- Do not bulk-generate lessons until the content contract, gold-standard lesson, and review process are approved.
- Distinguish verified functionality from mockups, placeholders, and planned work.
- Record material architectural decisions with their context, alternatives, and consequences.
- Verify license, provenance, attribution, and reuse conditions before importing external text, audio, images, or datasets.

## Current repository layout

~~~text
CLAUDE.md
.claude/
  rules/
  skills/
docs/
  product/
  architecture/
  domain/
  quality/
  sources/
  development/
content/
schemas/
scripts/
tests/
.github/
  ISSUE_TEMPLATE/
  workflows/
~~~

Directories will gain implementation files as the corresponding decisions and work items become ready. This repository deliberately avoids committing to an unapproved technology stack.

## How to contribute with Claude Code

1. Open the repository locally and start Claude Code from its root.
2. Ask Claude to read CLAUDE.md and only the documents relevant to the assigned task.
3. Work on one small task in a dedicated branch.
4. Run the documented checks, inspect the diff, and report any checks that were not run.
5. Open a pull request and merge only after review and passing checks.

See [Development workflow](./docs/development/WORKFLOW.md) for the fuller procedure.
