# Project Status

Last updated: 2026-10-12

## Current phase
**P1 — Content contract & skeleton** (P0 foundation completed). See [roadmap](./ROADMAP.md).

## Implemented (automatically verified in CI)
- Content contract v1: JSON Schemas, strict YAML loader, semantic validator, bundle compiler, answer evaluator, graph utilities (`packages/content-kit`) with unit + integration tests (valid and invalid fixtures).
- Content: the **A1 graph is mapped** (DG-012) — 67 concepts across 15 strands with dependencies, levels and en/uk/ru titles, 66 of them `planned` placeholders; 1 authored concept (V2) and the gold-standard unit with 10 exercises; 2 A1 routes. Coverage report: `npm run content:report`.
- Web skeleton (`apps/web`, Next.js): language picker, catalogue (route + concept list), lesson page rendering all block types, interactive exercises using the shared evaluator; honest banners for review/translation/persistence state; PWA manifest.
- Learning engine v1 (`packages/learning-engine`, DG-010): concept-state derivation, fixed-interval review scheduler, explainable recommendations with reason codes; 26 fixture tests (mutation-checked). Not yet wired to the app — needs persistence (DG-008/009).
- Learner-data schema (DG-008): `supabase/migrations` with RLS on every table, append-only evidence, server-only writes for derived state and entitlements, GDPR export function and cascade deletion; `supabase/tests` verify isolation, constraints and the policy inventory against a real PostgreSQL (mutation-checked, runs in CI). **No hosted Supabase project exists** — creating one needs owner authorization.
- CI: foundation check, content validation, tests, typecheck, static build of all language × unit pages.

## Authored but NOT human-verified
- German correctness and pedagogy of the gold unit (`review.*: pending`).
- uk/ru translations (machine drafts).
- Rights confirmation for original content (owner).

## Not implemented
Authentication, hosted database, persistence of real attempts, sync, engine integration in the UI, knowledge-map UI/search, lexicon, reading/listening/writing/speaking activities, analytics, monitoring, deployment, billing.

## Accepted decisions
ADR-0001 platform, ADR-0002 Supabase, ADR-0003 content format, ADR-0004 localization, ADR-0005 Vercel/GitHub Actions, ADR-0006 repo & tooling. Proposed: ADR-0007 media, ADR-0008 billing.

## Blockers needing the owner
1. Qualified reviewers for the gold unit (DG-007).
2. Commit `package-lock.json` (DG-011) — the cloud session cannot reach the npm registry or artifact storage.
3. Authorization before creating Supabase/Vercel projects (P2) — the schema and tests are ready to apply.

## Next recommended task
DG-009: record attempts as append-only events with server re-evaluation, wiring `apps/web` to the schema and the learning engine (needs a hosted project or a local stack to run against end to end).
