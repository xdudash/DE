# Near-term Backlog

The GitHub issue tracker is the live list; this file mirrors the next tasks with dependencies so a fresh Claude Code session can orient quickly. Update it when issues are created, closed, or re-ordered.

| ID | Task | Phase | Depends on | Ready? |
|---|---|---|---|---|
| DG-001 (#2) | Product journey & release scope — **done** by RELEASE_STAGES/PRODUCT_SPEC (this PR) | P0 | — | closes with PR |
| DG-002 (#3) | Lesson contract + gold unit — contract ✔; human review continues in DG-007 | P1 | — | closes with PR |
| DG-003 (#4) | Stack decision — **done** by ADR-0001/0002/0005/0006 | P0 | — | closes with PR |
| DG-004 (#5) | Languages & localization policy — **done** by ADR-0004 + LOCALIZATION_POLICY | P0 | — | closes with PR |
| DG-005 (#6) | Vet first external sources (pilot: frequency data for A1 vocabulary) | P4 prep | — | ready (research) |
| DG-006 (#7) | First end-to-end learning journey with persistence — split into DG-008/009/010 | P2 | DG-008..010 | umbrella |
| DG-007 (#10) | Human review of the gold unit (German, pedagogy, uk/ru translations, rights) and contract v1.x adjustments | P1 | reviewers | **needs owner** (reviewers) |
| DG-008 (#11) | Supabase local stack, SQL migrations, RLS isolation tests (no production project) | P2 | — | **done** in PR (supabase/, scripts/db_test.sh) |
| DG-009 (#12) | Attempt recording: server re-evaluation + append-only events | P2 | DG-008 ✔ | **done** in PR (`packages/attempts`, `/api/attempts`, ADR-0010) |
| DG-010 (#13) | Learning engine v1: state machine + recommendations as pure functions with fixtures | P2 | — | **done** in PR (packages/learning-engine) |
| DG-011 (#14) | Commit package-lock.json and switch CI to `npm ci` | P1 | — | **owner** (branch `chore/dg-011-commit-lockfile` exists; commit the artifact lockfile) |
| DG-012 (#15) | Map the A1 concept graph as `planned` concepts (+ en/uk/ru titles), coverage report | content track | — | **done** in PR (67 concepts, 2 routes, `content:report`) |
| DG-013 (#16) | Playwright E2E + axe for the lesson page; preview deployments (Vercel) | P2 | — (E2E); owner authorizes Vercel (previews) | **in review** (PR #26, ADR-0011); previews blocked on owner |
| DG-014 (#17) | UI i18n catalogs (ICU) + RTL layout check with an Arabic smoke test | P2 | — | **done** in PR (`packages/i18n`, ADR-0009) |
| DG-015 (#24) | Sign-in with Supabase Auth (magic link + Google/Apple) and session handling; removes the "progress is not saved" banner. Age gate part **done** in PR #28 (DG-015a) | P2 | DG-009 ✔, provider decision, hosted project | **needs owner** (provider decision, provisioning) |

## Process
Milestones, labels, WIP limits and Definition of Done: `docs/development/PROJECT_MANAGEMENT.md` (PR #25).

## Recommended order
DG-011 → ~~DG-010~~ ✔ → ~~DG-008~~ ✔ → ~~DG-014~~ ✔ → ~~DG-009~~ ✔ → **DG-015 (sign-in)** → DG-013, while DG-007 (human review) runs in parallel. Authoring A1 units stays blocked by DG-007.
