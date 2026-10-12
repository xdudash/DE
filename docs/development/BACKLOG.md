# Near-term Backlog

The GitHub issue tracker is the live list; this file mirrors the next tasks with dependencies so a fresh Claude Code session can orient quickly. Update it when issues are created, closed, or re-ordered.

| ID | Task | Phase | Depends on | Ready? |
|---|---|---|---|---|
| DG-001 | Product journey & release scope — **done** by RELEASE_STAGES/PRODUCT_SPEC (this PR) | P0 | — | closes with PR |
| DG-002 | Lesson contract + gold unit — contract ✔; human review continues in DG-007 | P1 | — | closes with PR |
| DG-003 | Stack decision — **done** by ADR-0001/0002/0005/0006 | P0 | — | closes with PR |
| DG-004 | Languages & localization policy — **done** by ADR-0004 + LOCALIZATION_POLICY | P0 | — | closes with PR |
| DG-005 | Vet first external sources (pilot: frequency data for A1 vocabulary) | P4 prep | — | ready (research) |
| DG-006 | First end-to-end learning journey with persistence — split into DG-008/009/010 | P2 | DG-008..010 | umbrella |
| DG-007 | Human review of the gold unit (German, pedagogy, uk/ru translations, rights) and contract v1.x adjustments | P1 | reviewers | **needs owner** (reviewers) |
| DG-008 | Supabase local stack, SQL migrations, RLS isolation tests (no production project) | P2 | — | **ready** |
| DG-009 | Attempt recording: server re-evaluation + append-only events | P2 | DG-008 | after DG-008 |
| DG-010 | Learning engine v1: state machine + recommendations as pure functions with fixtures | P2 | — | **ready** |
| DG-011 | Commit package-lock.json and switch CI to `npm ci` | P1 | — | **ready** (owner: `npm install` locally or download CI artifact) |
| DG-012 | Map the A1 concept graph as `planned` concepts (+ en/uk/ru titles), coverage report | content track | — | **ready** |
| DG-013 | Playwright E2E + axe for the lesson page; preview deployments (Vercel) | P2 | owner authorizes Vercel | partially ready |
| DG-014 | UI i18n catalogs (ICU) + RTL layout check with an Arabic smoke test | P2 | — | ready |

## Recommended order
DG-011 → DG-010 (pure logic, no infra) → DG-008 → DG-009 → DG-013/014, while DG-007 (human review) and DG-012 (graph mapping) run in parallel.
