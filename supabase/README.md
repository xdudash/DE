# Learner data (Supabase)

Schema, policies, and tests for learner data only. Learning **content** never lives here — it is YAML in `content/`, compiled at build time ([ADR-0003](../docs/architecture/decisions/ADR-0003-content-format-and-pipeline.md)). Design and privacy rules: [DATA_AND_PRIVACY.md](../docs/architecture/DATA_AND_PRIVACY.md). Provider decision: [ADR-0002](../docs/architecture/decisions/ADR-0002-backend-auth-database.md).

```text
migrations/   numbered SQL applied in order; the only source of schema truth
tests/        00_auth_shim.sql + 01_grants.sql (local platform emulation), then
              numbered test files asserting isolation, append-only evidence,
              constraints, cascade deletion, and the policy inventory itself
```

## Running the tests
Any PostgreSQL 15+ works; no Supabase account or Docker is required.

```bash
PGHOST=localhost PGPORT=5432 PGUSER=postgres ./scripts/db_test.sh   # or: npm run test:db
```

The script creates a scratch database, applies the local auth shim, applies every migration, applies the role grants, runs each test file, and drops the database. CI runs it against a `postgres:16` service container.

## Why there is a shim
Supabase provides `auth.users`, `auth.uid()`, the `anon` / `authenticated` / `service_role` roles, and default privileges that grant those roles access to new tables in `public`. `tests/00_auth_shim.sql` recreates exactly that much — including the broad default privileges — so the migrations' own `REVOKE` statements are what protects the data locally, just as on the hosted project. The shim is never applied to Supabase.

## Security model (verified by `tests/12_policy_inventory.sql`)
- RLS is enabled on every table; every policy is scoped with `auth.uid()`.
- `learning_events` is append-only: no UPDATE/DELETE policy exists and the API role does not hold those privileges.
- `concept_states`, `review_items`, `entitlements`, `audit_log` are readable by the owner and written only by the service role (billing webhooks, server recomputation).
- `anon` holds no privileges in `public`.
- `export_my_data()` is `security invoker`, so RLS applies to exports as well.

Mutation-checked: loosening any single policy, dropping RLS, re-granting UPDATE on events, or making the export `security definer` each makes the suite fail.

## Applying to a hosted project (not done yet)
No Supabase project exists for DeutschGo yet; creating one needs the owner's authorization (see [PROJECT_STATUS](../docs/development/PROJECT_STATUS.md)). When it does:

```bash
supabase link --project-ref <ref>     # EU region (Frankfurt)
supabase db push                      # applies migrations/ only — never tests/
```

Keep service-role keys out of the repository; see `.env.example`.
