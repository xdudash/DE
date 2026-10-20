# Project Status

Last updated: 2026-10-20

## Current phase
**P2 — learner loop** (in progress). P1 content skeleton is done. The P2 web app is on `main` and deployed by Vercel from `main`. See [roadmap](./ROADMAP.md).

## Implemented (on `main`, verified in CI)
- Content contract v1: JSON Schemas, strict YAML loader, semantic validator, bundle compiler, answer evaluator, graph utilities (`packages/content-kit`) with unit and integration tests (valid and invalid fixtures).
- Content: the **A1 graph is mapped** (DG-012): 67 concepts across 15 strands with dependencies, levels and en/uk/ru titles, 66 of them `planned` placeholders; 1 authored concept (V2) and the gold-standard unit with 10 exercises; 2 A1 routes. Coverage report: `npm run content:report`.
- Learning engine v1 (`packages/learning-engine`, DG-010): concept-state derivation, review scheduler, explainable recommendations with reason codes, fixture tests. Wired to the app: the next step is recommended only from lessons that exist.
- Attempt recording (`packages/attempts`, `apps/web/lib/data`, `POST /api/attempts`, DG-009): server-side re-evaluation, append-only events, derived state recomputed from stored evidence (ADR-0010). Verified by unit tests, SQL tests and a PostgreSQL 16 integration test in CI.
- Learner-data schema (DG-008): `supabase/migrations` with RLS on every table, GDPR export and cascade deletion. **No hosted Supabase project exists**; creating one needs owner authorization.
- Interface localization (DG-014, `packages/i18n`): typed catalogs for en (pivot), uk, ru and ar (preview, RTL), an ICU-subset formatter with `Intl.PluralRules`, and parity tests across catalogs.
- Web app (DG-016 to DG-018, merged in #33–#37, #39, #41):
  - Start screen with an introduction, the first-visit plan saved on this device, and a sentence-slot hero taken from the first lesson.
  - Lesson page: all block types, interactive exercises using the shared evaluator, honest review/translation/persistence banners, a result summary and next lesson.
  - Knowledge map with search and honest states; practice list driven by the scheduler; learner area with progress, plan, app status, and "delete my data" with confirmation.
  - Visual system per [VISUAL_SYSTEM.md](../product/VISUAL_SYSTEM.md): IBM Plex type, route rail, status labels, light and dark themes.
  - Installable PWA per ADR-0012: manifest, icons, service worker that keeps opened pages readable offline, offline indicator and fallback page.
  - Phone layout: bottom tab bar, safe-area handling, no sideways scroll at phone width.
- Quality gates: foundation check, content validation, unit tests, typecheck, static build of all locale × unit pages, Playwright journeys on desktop and phone with axe accessibility checks, PostgreSQL migration and RLS tests.

## Production link
- The permanent link is the **production deployment of `main`** on Vercel (ADR-0005). Every merge to `main` is deployed to it; a branch preview link (`de-git-<branch>-…`) is temporary and changes with each branch.
- The `main` commit status "Vercel" reports "Deployment has completed" for `0d9fc16` (PR #41).
- The address itself is not yet recorded here. Read it in the Vercel dashboard (project `de` → Domains). Record it here once the owner confirms it.
- A short custom domain is an owner decision (blocker 4). It is not created or attached without explicit authorization.

## In review (not yet on `main`)
- DG-019 phone lesson polish (branch `feat/phone-lesson-polish`): 44px tap targets for the language picker and gap fields, hyphenation of German text, 320px and tap-target E2E checks.

## Authored but NOT human-verified
- German correctness and pedagogy of the gold unit (`review.*: pending`).
- uk/ru translations and the uk/ru/ar interface strings: machine drafts, not reviewed.
- Rights confirmation for original content (owner).

## Not implemented
Sign-in (no browser can save progress yet: the endpoint answers "not signed in" and the lesson page says so); hosted database; offline queue and sync of attempts; lexicon; reading, listening, writing and speaking activities; an Arabic font for the preview locale; analytics; monitoring; billing.

## Accepted decisions
ADR-0001 platform (PWA first), ADR-0002 Supabase, ADR-0003 content format, ADR-0004 localization, ADR-0005 Vercel/GitHub Actions, ADR-0006 repo & tooling, ADR-0009 interface localization, ADR-0010 server database access, ADR-0011 end-to-end and accessibility testing, ADR-0012 PWA installability and offline shell. Proposed: ADR-0007 media, ADR-0008 billing.

## Blockers needing the owner
1. Qualified reviewers for the gold unit: one German, one pedagogical, uk and ru translation reviewers (DG-007). Rights confirmation for the original text.
2. Commit `package-lock.json` (DG-011). Branch `chore/dg-011-commit-lockfile` exists. The cloud session cannot reach the npm registry, so CI installs without a lockfile.
3. Sign-in provider decision for DG-015 (magic link, Google, Apple; an ADR is needed) and the hosted Supabase project with OAuth clients. Creating paid or external projects needs explicit authorization.
4. Product name, domain and legal entity before the first pilot (ROADMAP). This also decides the permanent custom address.

Resolved: Vercel preview authorization (DG-013) was granted and previews are live.

## Next recommended task
Merge DG-019 (`feat/phone-lesson-polish`) once CI is green. Then owner-free work: DG-005 source vetting, and A1 authoring only after DG-007 has recorded a review of the gold unit.
