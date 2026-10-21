# Quality Gates

## Principle
A green build proves only the checks that actually ran. Automated validation cannot prove German naturalness, teaching effectiveness, translation quality, or legal reuse rights — those are separate human gates ([content review](./CONTENT_REVIEW.md)).

## Required CI checks (GitHub Actions, every push/PR)
| Check | Command | Status |
|---|---|---|
| Foundation: required files, concise CLAUDE.md, relative links | `python3 scripts/check_foundation.py` | ✔ |
| Content validation: schema, ids, references, cycles, exercises, status gates, l10n coverage | `npm run content:validate` | ✔ |
| Unit + integration tests (incl. invalid fixtures) | `npm test` | ✔ |
| Type check (content-kit, web) | `npm run typecheck` | ✔ |
| Web build (static pages for every language × unit) | `npm run build` | ✔ |
| E2E journeys + accessibility (Playwright + axe; unconfigured-deployment state only, signed-in journey is DG-037) | `npm run e2e -w @deutschgo/web` | ✔ |
| DB migrations + RLS/policy tests (PostgreSQL service container) | `npm run test:db` | ✔ |

Run everything locally with `npm run check`.

## Every change
- Scope matches the task; no unrelated refactors; diff reviewed.
- No secrets, credentials, or real learner data (public repository).
- New behaviour has tests or a stated reason why not; failing checks are fixed, never weakened or deleted to get green.
- Docs updated when a decision or behaviour changes; report lists checks actually run.

## Content changes
- Validator passes; coverage table reviewed for intended languages.
- Status never raised above `needs_review` without recorded human reviews (validator-enforced for approved/published).
- Sources approved in `content/sources.yaml` for any non-original material.

## Learning journey gate (from P2)
Setup → topic navigation with prerequisite guidance → lesson → exercises with feedback → persisted attempt → state update → explainable next step; language and region switch; mobile layout; keyboard-only run; loading/empty/error/offline states.

## Privacy gate (before any real learner data, P3)
RLS isolation and policy-inventory tests pass (✔ in CI); export and deletion work end-to-end; privacy notice and processor list published; backups + restore test done; monitoring scrubs PII.

## Release gate
See [release stages](../product/RELEASE_STAGES.md#release-gate-applies-to-every-release) and [operations](./OPERATIONS.md#release-process). Production deployment requires explicit owner authorization.
