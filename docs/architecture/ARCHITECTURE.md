# Architecture

Status: **Accepted** (2026-10-12). Decisions: [ADR index](./decisions/README.md). Data/privacy: [DATA_AND_PRIVACY.md](./DATA_AND_PRIVACY.md). Operations: [OPERATIONS.md](../quality/OPERATIONS.md).

## Summary
A **modular monolith in one repository**: a Next.js (TypeScript) web app/PWA, a TypeScript content kit, content as YAML in Git compiled at build time, and Supabase (Postgres + Auth + Storage, EU region) for learner data only. Hosted on Vercel; CI on GitHub Actions. Native store apps later via Capacitor around the same web app. No microservices.

## Component map
```text
 GitHub repo (monorepo, npm workspaces)
 ├─ content/                YAML: concepts, units, routes, i18n, registries      (authored, reviewed)
 ├─ packages/content-kit/   schemas · loader · semantic checks · compiler ·      (pure TS, tested)
 │                          answer evaluator · graph · l10n resolution
 └─ apps/web/               Next.js App Router
      ├─ build time: content-kit compiles content → generated/content.json → static pages per lang × unit
      ├─ server: route handlers / server actions (P2): attempts, sync, settings, entitlements
      └─ client: lesson player, exercise player (shared evaluator), offline queue (P3)

 Runtime services
  Vercel (hosting, CDN, previews)   Supabase EU (Postgres+RLS, Auth, Storage)   Sentry-class error monitoring (P2)
  Object storage/CDN for audio (ADR-0007, P5)   Billing provider (ADR-0008, P7)   Cookieless analytics (P2)
```

## Module boundaries (enforced by folder structure and imports)
| Module | Responsibility | May depend on |
|---|---|---|
| `content-kit` | content types, validation, compile, evaluation, graph, l10n | nothing app-specific (no DB, no React) |
| `apps/web/lib/content` | read compiled bundle, resolve strings | content-kit |
| `apps/web/lib/learning` (P2) | evidence → states → recommendations (pure functions) | content-kit types |
| `apps/web/lib/data` (P2) | the only module that talks to Supabase; repository functions | Supabase client |
| `apps/web/app`, `components` | presentation | all of the above via their APIs |
| `apps/mobile` (P8) | Capacitor shell | apps/web build |

Teaching text never lives in components; learner data never lives in `content/`.

## Key data flows
1. **Content delivery:** YAML → `content:validate` → `content:build` → JSON bundle → static generation → CDN. Content updates ship by merging a PR (no DB migration). When the bundle outgrows a single file, split per language and unit (P3/P4, same contract).
2. **Answer attempt (P2):** client evaluates with the shared evaluator for instant feedback → sends attempt event (content id/version, response, result) → server **re-evaluates** with the same code against the bundle (never trusts client correctness) → inserts event → recomputes affected concept states → returns next-step recommendation.
3. **Sync (P3):** events are append-only with client-generated UUIDs → idempotent upload of an offline queue; states recomputed server-side.
4. **Profile/settings:** Supabase Auth user → `profiles` row (RLS: owner only).
5. **Export/deletion (P3):** server job assembles all rows for a user → JSON download; deletion cascades and is logged without content.

## Cross-cutting decisions
- **Language/runtime:** TypeScript strict everywhere; Node 22 LTS ([ADR-0006](./decisions/ADR-0006-repository-and-tooling.md)).
- **Rendering:** static generation for content pages (SEO for public concept pages, low cost); dynamic only for learner-specific views.
- **i18n:** content localization via content-kit; UI strings via message catalogs (library chosen in P2, ICU-capable, RTL-safe).
- **Accessibility:** semantic HTML, keyboard operable exercises, `lang="de"` on German text for screen readers, 44px targets, WCAG 2.2 AA target; axe checks in E2E tests (P2).
- **Security:** server-side authorization (RLS + server checks); secrets only in Vercel/Supabase/GitHub secret stores; dependency review; CSP headers (P2).
- **Testing:** node:test for content-kit; Vitest or node:test for app logic; Playwright E2E for journeys (P2); content validation in CI ([quality gates](../quality/QUALITY_GATES.md)).

## Scalability stance
Static content on a CDN plus Postgres for per-user events comfortably serves thousands of active learners. Re-evaluate when: bundle > 5 MB per language, DB > 10 GB, p95 API latency > 300 ms, or monthly infra cost > €150 (triggers recorded in [OPERATIONS.md](../quality/OPERATIONS.md)).

## Portability (exit paths)
Next.js can be self-hosted (Node server or container); Supabase is Postgres (pg_dump), auth users exportable; content is plain YAML in Git; evaluator/checks are dependency-light TypeScript. The single riskiest lock-in is Supabase Auth — mitigated by keeping auth calls inside `lib/data`.
