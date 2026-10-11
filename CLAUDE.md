# DeutschGo — Claude Code Instructions

## Mission
Build DeutschGo: a deep, flexible German-learning system for life, work, and study in Germany, Austria, and Switzerland. Quality of learning and content is the main differentiator; do not reduce it to a generic flashcard app.

## Read context selectively
- Start with this file and [README.md](./README.md).
- Product work: [Product vision](./docs/product/PRODUCT_VISION.md), [MVP scope](./docs/product/MVP_SCOPE.md), and [user flows](./docs/product/USER_FLOWS.md).
- Language/content work: [Knowledge model](./docs/domain/KNOWLEDGE_MODEL.md), [learning engine](./docs/domain/LEARNING_ENGINE.md), and [content standard](./docs/domain/CONTENT_STANDARD.md).
- Technical work: [architecture](./docs/architecture/ARCHITECTURE.md), relevant ADRs, and [quality gates](./docs/quality/QUALITY_GATES.md).
- Follow the [development workflow](./docs/development/WORKFLOW.md).
- Read only the extra files needed for the current task; do not load the whole content repository by default.

## Non-negotiable principles
1. Keep language knowledge, curriculum, learning content, learner state, and UI code separate.
2. Prefer small, reversible, testable changes over broad rewrites.
3. Do not invent project decisions. If an unresolved decision blocks implementation, recommend options and record the accepted choice.
4. Do not bulk-create lessons before the content contract, gold-standard lesson, and review process are approved.
5. Never present mock, placeholder, or planned functionality as implemented.
6. Verify provenance and reuse permissions before copying external content or media.
7. Preserve working behaviour unless the task explicitly changes it.
8. Never commit secrets, credentials, or real personal learner data.

## Standard task procedure
1. Identify the exact task and acceptance criteria. Inspect repository status and relevant files first.
2. State a brief plan for non-trivial work.
3. Inspect dependencies and adjacent tests before editing.
4. Implement the smallest coherent change; avoid unrelated formatting and renaming.
5. Run focused checks, then broader applicable checks.
6. Review the diff for accidental changes, missing tests, broken links, security issues, and scope creep.
7. Report changed files, checks actually run, results, limitations, and the next dependency. Never claim an unrun check passed.

## Git discipline
- Use a dedicated branch for each bounded task; do not work on main unless explicitly instructed.
- Do not force-push, rewrite history, delete branches, change repository visibility, or deploy to production without explicit authorization.
- Keep commits focused and descriptive. Open a pull request with context and test evidence.
- Do not merge merely because code was generated; follow the review and quality gates.

## Context and token efficiency
- Committed documentation is the project record; chat history is not the sole source of truth.
- Link to canonical docs instead of copying their contents into prompts.
- Read targeted files and search for symbols rather than opening large files indiscriminately.
- Summarize long command output; inspect full logs only when debugging.
- Use relevant skills in .claude/skills for repeatable workflows.
- Do not repeat discovery or restate the whole project in every response.

## Current status
The repository is in the product/technical foundation phase. The final application stack, backend, database, hosting, mobile delivery, billing provider, and production data model are not approved. Do not silently lock these choices.

## Completion report
End implementation tasks with:
- Result
- Files changed
- Checks run and outcome
- Unverified risks or limitations
- Suggested next task
