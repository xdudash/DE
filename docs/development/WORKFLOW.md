# Development Workflow

## Task sizing
A task should be small enough to understand, implement, test, and review as one change. Split work when it touches unrelated modules, makes multiple unresolved architecture decisions, or has no clear acceptance criteria.

Every issue should state problem/user value, scope/non-goals, dependencies and canonical docs, acceptance criteria, required checks, risks, and how success will be verified.

## Branches and pull requests
- main contains reviewed project state.
- Use short-lived branches: feat/topic, fix/topic, docs/topic, content/topic, chore/topic.
- Keep one issue or tightly related unit of work per branch.
- Open a pull request with goal, decisions, files changed, validation results, and limitations.
- Keep commits focused and descriptive.
- Fix failing checks or explicitly document and approve why a check cannot apply.
- Do not force-push or run destructive repository commands unless authorized.

## Claude Code loop
1. Read CLAUDE.md.
2. Inspect branch and working tree; do not overwrite unrelated work.
3. Read the issue and relevant canonical docs.
4. Propose a short plan for multi-step work.
5. Implement a minimal vertical slice.
6. Run focused checks and broader applicable checks.
7. Review the diff.
8. Report actual outcomes and prepare the PR summary.
9. Update docs/status when a durable decision or project state changes.

## Commands
`npm run check` runs everything CI runs (foundation check, content validation, tests, typecheck, web build). Use the narrower commands listed in CLAUDE.md for focused checks.

## Daily handoff
Persist durable facts only in PROJECT_STATUS.md / BACKLOG.md and the issue tracker: changes/commit/PR, checks and outcomes, accepted/open decisions, current blocker, next smallest task. Do not paste large chat transcripts into the repository.

## Context/token discipline
- Global rules go in CLAUDE.md; scoped rules in .claude/rules; repeatable procedures in .claude/skills.
- Read targeted files and search for symbols; do not load every lesson or log by default.
- Keep command output focused and inspect full logs only for troubleshooting.
- Avoid repeated speculative refactors; record hard-to-reverse decisions.
- Start a fresh task context when previous chat has irrelevant history; pass a short handoff with canonical links.

## Claude.ai Project context
For copy-ready Project Instructions and guidance on Project Knowledge, use [Claude Project Context](./CLAUDE_PROJECT_CONTEXT.md). Claude.ai chats must not claim live repository access unless a working connector/access path is available.

## Safety and release
- No production deploys, billing changes, live migrations, or deletion of learner data without explicit authorization.
- Never place secrets in prompts, logs, files, or issues.
- Review dependency licensing and maintenance before adoption.
- A passing CI run does not replace linguistic, accessibility, security, or product review.

## Completion report
### Result
Summary of outcome.

### Files changed
Paths and purpose.

### Checks
Commands actually run and results; say “not run” when applicable.

### Limitations
Known risks and unresolved decisions.

### Next task
One concrete, dependency-aware next step.
