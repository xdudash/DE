# Project Status

Last updated: 2026-10-19 (after merging PRs #23, #25, #26, #27, #28, #29)

## Current phase
**P1 — Content contract & skeleton** (P0 foundation completed). See [roadmap](./ROADMAP.md).

## Implemented (automatically verified in CI)
- Content contract v1: JSON Schemas, strict YAML loader, semantic validator, bundle compiler, answer evaluator, graph utilities (`packages/content-kit`) with unit + integration tests (valid and invalid fixtures).
- Content: the **A1 graph is mapped** (DG-012) — 67 concepts across 15 strands with dependencies, levels and en/uk/ru titles, 66 of them `planned` placeholders; 1 authored concept (V2) and the gold-standard unit with 10 exercises; 2 A1 routes. Coverage report: `npm run content:report`.
- Web skeleton (`apps/web`, Next.js): language picker, catalogue (route + concept list), lesson page rendering all block types, interactive exercises using the shared evaluator; honest banners for review/translation/persistence state; PWA manifest.
- Learning engine v1 (`packages/learning-engine`, DG-010): concept-state derivation, fixed-interval review scheduler, explainable recommendations with reason codes; 26 fixture tests (mutation-checked). Not yet wired to the app — needs persistence (DG-008/009).
- Learner-data schema (DG-008): `supabase/migrations` with RLS on every table, append-only evidence, server-only writes for derived state and entitlements, GDPR export function and cascade deletion; `supabase/tests` verify isolation, constraints and the policy inventory against a real PostgreSQL (mutation-checked, runs in CI). **No hosted Supabase project exists** — creating one needs owner authorization.
- Interface localization (`packages/i18n`, DG-014): typed catalogs for en (pivot), uk, ru and ar (preview, RTL), a dependency-free ICU-subset formatter with `Intl.PluralRules`, and tests that format every message of every catalog and enforce key/placeholder parity; the web app renders all its chrome from these catalogs and a cross-check test keeps the interface registry and `content/languages.yaml` in agreement.
- Attempt recording (`packages/attempts`, `apps/web/lib/data`, `POST /api/attempts`, DG-009): request validation, server-side re-evaluation (the client's verdict is rejected outright), append-only events with idempotent retries, derived state and review schedule recomputed from stored evidence, and two separated database contexts (learner under RLS, service role for derived rows — ADR-0010). Verified by unit tests, statement-level SQL tests and an integration test against a real PostgreSQL in CI.
- CI: foundation check, content validation, tests, typecheck, static build of all locale × unit pages (including the Arabic preview locale), plus migrations, RLS and attempt-recording tests against PostgreSQL 16.

## Authored but NOT human-verified
- German correctness and pedagogy of the gold unit (`review.*: pending`).
- uk/ru translations (machine drafts).
- Rights confirmation for original content (owner).

## Not implemented
Sign-in (so no browser can yet save progress — the endpoint answers "not signed in" and the lesson page says so), hosted database, offline queue and sync, recommendations in the UI, knowledge-map UI/search, Arabic explanations (interface only), lexicon, reading/listening/writing/speaking activities, analytics, monitoring, deployment, billing.

## Merged on 2026-10-19
- DG-007 review packet: `docs/quality/GOLD_UNIT_REVIEW_PACKET.md` (PR #23). No human review recorded.
- Project management operating model, milestones and labels: `docs/development/PROJECT_MANAGEMENT.md` (PR #25).
- DG-013 browser journeys, phone-width layout, and axe accessibility gate, with the `e2e` CI job and ADR-0011 (PR #26). Vercel previews are still open.
- DG-015a 16+ age gate endpoint, provider-agnostic. Fixed the attempt store (concept states and review items wrote NULL keys) and made the database suites actually run in CI (`react-server` condition) (PR #28).
- Product decision: the app is free during build-out; monetization is one later change in P7 ([MONETIZATION](../product/MONETIZATION.md), PR #27).
- Status and owner blockers refreshed (PR #29).

## Accepted decisions
ADR-0001 platform, ADR-0002 Supabase, ADR-0003 content format, ADR-0004 localization, ADR-0005 Vercel/GitHub Actions, ADR-0006 repo & tooling, ADR-0009 interface localization, ADR-0010 server database access, ADR-0011 end-to-end and accessibility testing. Proposed: ADR-0007 media, ADR-0008 billing.

## Blockers needing the owner
1. Qualified reviewers for the gold unit: one German, one pedagogical, uk and ru translation reviewers (DG-007, `status:blocked-owner`). Rights confirmation for the original text.
2. Commit `package-lock.json` (DG-011). Branch `chore/dg-011-commit-lockfile` exists; the lockfile artifact from its CI run can be downloaded in the browser. The cloud session cannot reach the npm registry or artifact storage.
3. Sign-in provider decision for DG-015: magic link, Google, Apple (an ADR is needed), and the hosted Supabase project with OAuth clients. Creating paid or external projects needs explicit authorization.
4. Vercel preview authorization (DG-013, the preview part only; E2E itself does not need it).

## Next recommended task
DG-015 sign-in: the age gate is built (DG-015a); what remains (sign-in flows and session storage) waits for the provider decision (blocker 3). Owner-free work continues in the content track (DG-005 source vetting, A1 batches after DG-007).
