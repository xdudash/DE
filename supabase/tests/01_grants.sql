-- Post-migration sanity grants.
--
-- API-role privileges are granted by DEFAULT privileges in 00_auth_shim.sql (as on
-- Supabase), so by this point `authenticated` already has broad table privileges and
-- the migrations have revoked what must stay closed. Nothing here re-opens them:
-- the only grant is read access on the server-maintained tables, which the learner
-- is allowed to see through RLS.
grant select on public.concept_states, public.review_items, public.entitlements, public.audit_log to authenticated;

-- Assertion helper shared by the test files.
create or replace function public.dg_assert(condition boolean, label text) returns void
language plpgsql as $$
begin
  if condition is not true then raise exception 'ASSERTION FAILED: %', label; end if;
end;
$$;
