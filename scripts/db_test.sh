#!/usr/bin/env bash
# Applies supabase/migrations to a scratch database and runs supabase/tests.
#
# Local use (needs a running PostgreSQL 15+ and psql):
#   PGHOST=/tmp PGPORT=55432 PGUSER=postgres ./scripts/db_test.sh
# CI uses the postgres service container (see .github/workflows/ci.yml).
#
# The tests create their own roles and an `auth` schema shim, because Supabase
# provides auth.users/auth.uid() on the hosted project. Migrations themselves
# contain no shim and are applied to Supabase unchanged.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB="${DG_TEST_DB:-deutschgo_test_$$}"
export PGDATABASE=postgres

psql -v ON_ERROR_STOP=1 -q -c "drop database if exists \"$DB\"" -c "create database \"$DB\"" >/dev/null
trap 'psql -q -c "drop database if exists \"$DB\"" >/dev/null 2>&1 || true' EXIT

run() { psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$1"; }

echo "--- applying local auth shim"
run "$ROOT/supabase/tests/00_auth_shim.sql"

echo "--- applying migrations"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "    $(basename "$f")"
  run "$f"
done

echo "--- applying API role grants"
run "$ROOT/supabase/tests/01_grants.sql"

echo "--- running tests"
status=0
for f in "$ROOT"/supabase/tests/[1-9]*.sql; do
  name="$(basename "$f")"
  if out="$(psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$f" 2>&1)"; then
    echo "ok   $name"
  else
    echo "FAIL $name"
    echo "$out" | sed 's/^/     /'
    status=1
  fi
done

if [ "$status" -eq 0 ]; then
  echo "All database tests passed (RLS isolation, append-only events, constraints, cascade deletion)."
else
  echo "Database tests failed." >&2
fi
exit "$status"
