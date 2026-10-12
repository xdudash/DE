# Project Status

Last updated: 2026-10-12

## Current phase
**P1 — Content contract & skeleton** (P0 foundation completed). See [roadmap](./ROADMAP.md).

## Implemented (automatically verified in CI)
- Content contract v1: JSON Schemas, strict YAML loader, semantic validator, bundle compiler, answer evaluator, graph utilities (`packages/content-kit`) with unit + integration tests (valid and invalid fixtures).
- Content: 1 authored concept (V2), 9 planned concepts, 1 route, 1 gold-standard unit with 10 exercises; en (pivot, draft), ru/uk (machine drafts).
- Web skeleton (`apps/web`, Next.js): language picker, catalogue (route + concept list), lesson page rendering all block types, interactive exercises using the shared evaluator; honest banners for review/translation/persistence state; PWA manifest.
- CI: foundation check, content validation, tests, typecheck, static build of all language × unit pages.

## Authored but NOT human-verified
- German correctness and pedagogy of the gold unit (`review.*: pending`).
- uk/ru translations (machine drafts).
- Rights confirmation for original content (owner).

## Not implemented
Accounts, database, persistence, sync, learning-state engine, recommendations, review scheduler, knowledge-map UI/search, lexicon, reading/listening/writing/speaking activities, analytics, monitoring, deployment, billing.

## Accepted decisions
ADR-0001 platform, ADR-0002 Supabase, ADR-0003 content format, ADR-0004 localization, ADR-0005 Vercel/GitHub Actions, ADR-0006 repo & tooling. Proposed: ADR-0007 media, ADR-0008 billing.

## Blockers needing the owner
1. Qualified reviewers for the gold unit (DG-007).
2. Commit `package-lock.json` (DG-011) — the cloud session cannot reach the npm registry or artifact storage.
3. Authorization before creating Supabase/Vercel projects (P2).

## Next recommended task
DG-010: learning engine v1 as pure, fixture-tested functions (no infrastructure needed), in parallel with DG-007 review.
