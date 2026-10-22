# Operations: Testing, Release, Monitoring, Backup, Analytics

Status: **Accepted** design (2026-10-12). Most items are implemented in P2–P3; nothing here is live yet unless marked ✔.

## Environments
| Env | Purpose | Data |
|---|---|---|
| local | development; local Supabase stack (P2) | synthetic only |
| preview | per-PR Vercel deployment (P2) | synthetic only |
| production | `main` after required checks | real learners (only after the P3 privacy gate) |

## Testing pyramid
- ✔ Content: schema + semantic validation, invalid fixtures, deterministic bundle.
- ✔ Unit: evaluator, graph, l10n, checks (`node:test`).
- P2: learning-engine state transitions and recommendations with fixtures; RLS isolation tests against local Supabase.
- P2: Playwright E2E for the core journey (setup → unit → exercises → persisted result → next step), axe accessibility checks, mobile viewport.
- ✔ Build: static generation of every language × unit page in CI.

## Release process
1. Small PRs from `feat/*`, `content/*`, `fix/*` branches; required checks green; owner review/merge.
2. Production deploy from `main` (Vercel). Content-only changes follow the same path.
3. Release notes: [CHANGELOG](../development/CHANGELOG.md), user-visible changes and known limitations; each PR that a learner can notice adds an entry.
4. Rollback: redeploy previous production build (instant); DB migrations must be backward compatible for one release (expand → migrate → contract).
5. Never deploy production, run migrations on production, or touch billing without explicit owner authorization.

## Monitoring (P2)
Error monitoring (Sentry-class, EU data region, PII scrubbing), uptime check, Supabase/Vercel usage alerts, weekly cost review. Alert thresholds documented when configured.

## Backups and recovery (P3, before R1)
Provider daily backups + weekly logical dump to separate EU storage (encrypted); restore test quarterly and before each release stage; RPO ≤ 24 h, RTO ≤ 4 h initially.

## Analytics
- Product analytics: cookieless, EU-hosted (e.g. Plausible-class or self-hosted Umami), page/feature events only, no personal identifiers.
- Learning analytics: computed from `learning_events` (aggregated); per-item difficulty and "accepted-answer gaps" (frequent wrong answers that might be correct) feed content maintenance.
- Every experiment states hypothesis, metric, and stop rule before launch.

## Cost and scale triggers
Review architecture when any holds: bundle > 5 MB per language; DB > 10 GB; p95 API latency > 300 ms; monthly infrastructure > €150; build time > 10 min.

## Incident handling
Severity levels, steps, the GDPR notification rules and a post-mortem template: [incidents](../development/INCIDENTS.md).
