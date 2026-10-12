#!/usr/bin/env bash
# Creates a database, applies the local auth shim, every migration and the test grants,
# then leaves it in place. Used by scripts/db_test.sh and by the attempt-store
# integration test, which needs a migrated database it can connect to.
#
#   ./scripts/db_prepare.sh deutschgo_integration
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB="${1:?usage: db_prepare.sh DATABASE}"
export PGDATABASE=postgres

psql -v ON_ERROR_STOP=1 -q -c "drop database if exists \"$DB\"" >/dev/null
psql -v ON_ERROR_STOP=1 -q -c "create database \"$DB\"" >/dev/null

apply() { psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$1"; }
apply "$ROOT/supabase/tests/00_auth_shim.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do apply "$f"; done
apply "$ROOT/supabase/tests/01_grants.sql"
echo "prepared database \"$DB\""
