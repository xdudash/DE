# ADR-0003: Content format and pipeline — YAML in Git, JSON Schema 2020-12, build-time bundle

- Status: Accepted (implemented in this PR)
- Date: 2026-10-12

## Context
Content is the product's core asset: thousands of concepts, units, exercises in up to 9 explanation languages; must be reviewable in diffs, validated automatically, versioned, and editable by a solo founder with AI help — without code changes for content updates.

## Options considered
| | YAML + JSON Schema in Git (chosen) | JSON in Git | Markdown + front-matter | Headless CMS | Database |
|---|---|---|---|---|---|
| Prose editing | Good (block scalars, comments) | Poor (escaping) | Excellent | Good | Poor |
| Structured exercises | Good | Good | Weak | Medium | Good |
| Diff/review in PR | Good | Medium | Good | Poor (outside Git) | Poor |
| Validation | JSON Schema + code | same | custom | vendor | constraints |
| Cost/lock-in | none | none | none | subscription, vendor | ops |

## Decision
- Author in **YAML 1.2** only (strict parsing, `.yaml`), one entity per file, file name = id.
- Validate with **JSON Schema 2020-12** (Ajv in Node; any compliant validator works) plus semantic checks in `packages/content-kit`.
- Compile at **build time** into a JSON bundle consumed by the app; content updates deploy through the normal PR → CI → deploy path.
- Learner data never in Git; content never in the DB (except future denormalised copies for search if needed).

## Consequences
- + Full history, review, rollback; no CMS cost; validator gives immediate feedback to authors and to Claude.
- − Non-technical reviewers need a friendly review view (P2 task: review pages rendering drafts in the app; reviewers comment via GitHub or a form).
- − Bundle size grows; split per language/unit when > 5 MB (planned).

## Verification
CI runs `content:validate`, unit + integration tests (valid and invalid fixtures), and `content:build` before the web build (implemented).
