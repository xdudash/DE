# Project management

Status: **Accepted** (2026-10-19). One founder with AI-assisted delivery. This document is the operating model: how work is structured, tracked, limited and closed. Product scope lives in [PRODUCT_SPEC](../product/PRODUCT_SPEC.md); sequencing in [ROADMAP](./ROADMAP.md); near-term items in [BACKLOG](./BACKLOG.md).

## 1. Structure: four levels

| Level | Meaning | Where it lives |
|---|---|---|
| **Phase** | A roadmap phase with exit criteria (P1…P8) | GitHub milestone (`P1 …` … `P8 …`) and [ROADMAP](./ROADMAP.md) |
| **Epic** | A delivery track inside a phase (for example DG-006, the first learning journey) | GitHub issue labelled `epic` |
| **Task** | One reviewable change, sized to a single PR (DG-0xx) | GitHub issue, linked to its epic |
| **Subtask** | A checkable step inside a task, kept in the PR description or task list | Not tracked as issues |

The **roadmap is the source of phase order**. Milestones mirror it. A milestone closes only when its phase exit criteria pass, not when its issues are all closed.

The content track has its own milestone (`Content track: A1 batches`), because content advances at review pace, independently of the code phases.

## 2. Labels

| Label | Use |
|---|---|
| `track:content` | Authoring, sources, translations, review |
| `track:app` | Web app UI and interaction |
| `track:data` | Learner data, Supabase, RLS, engine, attempts |
| `track:platform` | CI, tooling, hosting, infrastructure |
| `track:docs` | Documentation and decisions |
| `status:blocked-owner` | Cannot proceed without an owner action (accounts, decisions, reviewers, rights) |
| `status:needs-review` | Waiting for a human content or code review |
| `epic` | Groups related tasks |
| `phase:P1`, `phase:P2` | Earlier labels, kept for history; milestones are now the source |

## 3. Limits and cadence

- **WIP limit: one active task per track**, plus at most one task waiting on a human. A blocked task moves to `status:blocked-owner` and the next task in another track starts.
- **Branches:** one per task (`feat/`, `fix/`, `docs/`, `content/`, `chore/`). One PR per task. Stacked PRs are avoided: each branches from `main`. If a stack is unavoidable, the PR says what it depends on and the base is `main` again once that dependency merges.
- **Status is written, not remembered.** Each merged task updates [BACKLOG](./BACKLOG.md) and, when the state changes, [PROJECT_STATUS](./PROJECT_STATUS.md). The GitHub issue closes with a comment linking the PR.
- **Decisions** go into an ADR before the work that depends on them. A decision made in chat without an ADR is not a decision.

## 4. Definition of Done

A task is done when all of these hold:

1. Acceptance criteria are written in the issue or PR, and each one is met.
2. The narrowest relevant automated checks pass, and CI is green on the PR head commit. Checks that did not run are reported as not run.
3. Tests cover the new behaviour, including failure paths and invalid input, and any fixed bug has a regression test.
4. Docs that describe the changed behaviour are updated, and `scripts/check_foundation.py` passes.
5. No secrets, real learner data, or material with unclear rights. Content has its review status set honestly.
6. The PR states what was verified, what was not, and any residual risk.

A phase is done when its exit criteria in [ROADMAP](./ROADMAP.md) are met with evidence, and the milestone is closed.

## 5. Honesty rules for status

- A feature is `done` only when it works end to end in CI. A screen that shows a feature without the feature is not done.
- Unreviewed content is never shown or reported as approved. Machine translations are never reported as reviewed.
- A check that cannot run in the current environment is reported as "not run here, runs in CI" and is never reported as passed.

## 6. Risk and dependency registers

Risks are in [ROADMAP](./ROADMAP.md). Owner blockers are the `status:blocked-owner` issues, listed in [PROJECT_STATUS](./PROJECT_STATUS.md). Each blocker names the single owner action that unblocks it, so the owner can act in one step.

## 7. Automation

- CI runs on every push and PR: foundation check, content validation, tests, typecheck, build, database tests, and E2E (once DG-013 lands).
- Milestone and label setup is recorded here; changing the model means changing this document in a PR.
