# Architecture Decision Records (ADRs)

ADRs document significant decisions so future work does not silently reopen or contradict them.

## Index
| ADR | Decision | Status |
|---|---|---|
| [ADR-0001](./ADR-0001-application-platform.md) | Next.js + TypeScript web app/PWA first; Capacitor for store apps later | Accepted |
| [ADR-0002](./ADR-0002-backend-auth-database.md) | Supabase (EU) for auth, Postgres, storage — learner data only | Accepted (provisioning in P2) |
| [ADR-0003](./ADR-0003-content-format-and-pipeline.md) | YAML in Git + JSON Schema 2020-12 + build-time compiled bundle | Accepted, implemented |
| [ADR-0004](./ADR-0004-localization.md) | Per-entity localization files, English pivot, explicit review states | Accepted, implemented |
| [ADR-0005](./ADR-0005-hosting-and-delivery.md) | Vercel hosting + GitHub Actions CI; previews per PR | Accepted (provisioning in P2) |
| [ADR-0006](./ADR-0006-repository-and-tooling.md) | Single monorepo, npm workspaces, Node 22, TS strict, node:test/Playwright | Accepted, implemented |
| [ADR-0007](./ADR-0007-media-and-audio.md) | Audio: object storage + manifests in Git; recorded speech preferred, TTS labelled | Proposed (decide in P5) |
| [ADR-0008](./ADR-0008-billing.md) | Billing via merchant-of-record (Paddle) for web; RevenueCat when native | Proposed (decide in P7) |
| [ADR-0009](./ADR-0009-ui-i18n.md) | Interface localization: typed catalogs + minimal in-house ICU subset | Accepted, implemented |
| [ADR-0010](./ADR-0010-server-database-access.md) | Server-side database access with `pg` and per-request role switching | Accepted, implemented |
| [ADR-0011](./ADR-0011-end-to-end-and-accessibility-testing.md) | End-to-end and accessibility testing with Playwright and axe-core | Accepted, implemented |
| [ADR-0012](./ADR-0012-pwa-installability-and-offline-shell.md) | Installable PWA shell; offline reading of opened pages only, sync stays P3 | Accepted, implemented |
| [ADR-0013](./ADR-0013-sign-in-and-accounts.md) | Sign-in with Google or Apple via Supabase Auth, PKCE, HttpOnly cookie session, 16+ at sign-up, POST-only writes; tokens verified against the project's JWKS (amended by DG-026) | Accepted, implemented |
| [ADR-0014](./ADR-0014-motivation-xp-streaks-hearts.md) | XP, levels, streaks and hearts derived from evidence, with guardrails | Accepted, implemented (device-only numbers) |
| [ADR-0015](./ADR-0015-daily-push-reminders.md) | Opt-in daily push reminder (Web Push, Vercel Cron, account-bound subscriptions) | Accepted, implemented; not configured (owner setup) |

## When to write one
Record choices affecting data ownership, privacy/security, deployability, operating cost, major dependencies, content format, provider lock-in, or difficult-to-reverse boundaries.

## Workflow
1. State problem and constraints. 2. List realistic alternatives. 3. Compare effort, cost, lock-in, quality, accessibility, security/privacy, maintenance. 4. Decide and explain trade-offs. 5. Status: Proposed, Accepted, Superseded, Rejected. 6. Update affected docs.

## Template
~~~markdown
# ADR-NNNN: Short decision title
- Status: Proposed | Accepted | Superseded | Rejected
- Date: YYYY-MM-DD
- Decision owner: Project owner
## Context
## Options considered
## Decision
## Consequences
## Verification
~~~
