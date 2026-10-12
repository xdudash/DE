# ADR-0010: Server-side database access — `pg` with role switching per request

- Status: Accepted (implemented in DG-009)
- Date: 2026-10-12
- Decision owner: Project owner

## Context
[ADR-0002](./ADR-0002-backend-auth-database.md) chose Supabase (managed PostgreSQL) for learner data, and the schema puts the guarantees in the database: row-level security on every table, append-only `learning_events`, and derived caches (`concept_states`, `review_items`) that learners may read but only the server may write. Server code must therefore be able to act **as the learner** (so RLS decides) and, separately, **as the server** (for the derived rows) — and attempts must be re-evaluated server-side before anything is stored.

## Options considered
| | A. `@supabase/supabase-js` (PostgREST over HTTPS) | B. `pg` with `set local role` (chosen) | C. Supabase client plus a second service-role client |
|---|---|---|---|
| Honours RLS per learner | Yes, via the user's JWT | Yes, via `set local role authenticated` + `request.jwt.claims` | Yes |
| Writes the server-only rows | Needs the service-role key, which bypasses RLS entirely | Same, via `set local role service_role` | Yes |
| SQL we can read and test | Query builder; upserts of a row set are awkward | Plain SQL, identical to what `supabase/tests/*.sql` verifies | Mixed |
| Transactions | Not available over PostgREST | Native: event insert and state refresh share one transaction | Partial |
| Portability off Supabase | Rewrite (PostgREST-specific) | None: standard PostgreSQL | Rewrite |
| Dependencies | HTTP client + auth client | One mature driver (`pg`) | Two clients |
| Serverless fit | Stateless HTTP | Pool with small max and short idle timeout | — |

## Decision
Use **`pg`** from server code only, behind `apps/web/lib/data/pg.ts`, which exposes exactly two contexts:
- `withLearner(userId, fn)` — `begin; set local role authenticated; set_config('request.jwt.claims', …, true)` so every statement is subject to RLS;
- `withService(fn)` — `begin; set local role service_role` for rows the schema forbids learners to write; every statement there carries an explicit `user_id`, because RLS is no longer helping.

Both reset the role on release, so a pooled connection is never handed out with a role attached. Session tokens are verified separately (`lib/auth/jwt.ts`, HS256, no dependency); the database never sees a token, only a claims string the server built.

Supabase's generated client remains an option for browser-side reads later; nothing in this decision prevents adding it for data that is genuinely public or genuinely user-scoped by RLS.

## Consequences
- + The SQL in the application and the SQL in the database tests are the same statements, so `supabase/tests/13_attempt_write_paths.sql` really covers the write paths.
- + Transactions, portability to any PostgreSQL, and no provider-specific query semantics.
- − The app needs a connection string with a role that may `set role` to both API roles; that credential is as powerful as the service key and lives only in server-side secrets.
- − Connection pooling must stay modest in a serverless deployment (`DATABASE_POOL_MAX`, Supabase's pooler endpoint).
- − We must keep enforcing scoping by hand inside `withService`.

## Verification
`supabase/tests/13_attempt_write_paths.sql` (statement-level, in CI and locally) and `apps/web/test/attempt-store.integration.test.ts` against a migrated PostgreSQL in CI: append-only enforcement, idempotent retries, cross-learner isolation, and that no connection is released with a role still set.
