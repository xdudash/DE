# ADR-0002: Backend, auth, database — Supabase (EU region) for learner data only

- Status: Accepted (provisioning happens in P2; no project is created by this ADR)
- Date: 2026-10-12

## Context
Need accounts, per-user append-only learning events, derived states, sync, export/deletion, EU data residency, minimal ops for one person, predictable cost for 1,000+ users. Content is NOT stored in the database (ADR-0003).

## Options considered
- **Supabase** — managed Postgres + Auth + Storage + Row-Level Security; EU regions; open-source core; free tier for development, paid tier for production (~USD 25/month at time of writing — verify at provisioning). Free projects pause on inactivity: unsuitable for production.
- **Neon/managed Postgres + Better Auth/Auth.js + own API** — maximal portability, more code to own (sessions, email, password reset, security).
- **Firebase** — mature auth, but document DB fits relational evidence/analytics poorly; Google lock-in.
- **PocketBase / self-hosted Postgres on a VPS** — cheapest, but backups, patching, uptime are on the founder.

## Decision
**Supabase**, EU region (Frankfurt), used for Auth, Postgres (RLS on every table), and later Storage for user uploads if needed. All database access goes through `apps/web/lib/data` so the provider is replaceable. Migrations are SQL files in the repo, applied via the Supabase CLI in CI/CD (P2).

## Consequences
- + Little security-critical code to write; Postgres is portable (pg_dump); RLS gives defence in depth.
- − Supabase Auth is the main lock-in; mitigated by the data-access module and standard JWTs.
- − Paid plan required before real learner data (budget item).

## Verification
P2: RLS tests (user A cannot read user B) in CI against a local Supabase stack; restore test from backup before R1.
