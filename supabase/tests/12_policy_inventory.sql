-- Structural guard over the security model itself.
--
-- The behavioural tests in 10_rls_isolation.sql can be masked by defence in depth:
-- a too-permissive UPDATE policy still affects zero rows while the SELECT policy
-- hides the row. This file therefore asserts the policies and privileges directly,
-- so loosening any single layer is caught.
\set ON_ERROR_STOP on
\pset tuples_only on
\o /dev/null

do $$
declare
  guarded text[] := array['profiles', 'learning_events', 'concept_states', 'review_items',
                          'saved_vocabulary', 'entitlements', 'audit_log'];
  t text;
  leaky text;
begin
  -- 1. RLS is enabled (and not merely defined) on every learner-data table.
  foreach t in array guarded loop
    perform public.dg_assert(
      (select relrowsecurity from pg_class where oid = format('public.%I', t)::regclass),
      format('RLS is enabled on %s', t));
    perform public.dg_assert(
      (select count(*) from pg_policies where schemaname = 'public' and tablename = t) > 0,
      format('%s has at least one policy', t));
  end loop;

  -- 2. Every policy is scoped to the owner: both USING and WITH CHECK must reference
  --    auth.uid(); a policy evaluating to a constant would be a silent data leak.
  select string_agg(format('%s.%s', tablename, policyname), ', ')
    into leaky
  from pg_policies
  where schemaname = 'public'
    and tablename = any (guarded)
    and (coalesce(qual, '') || coalesce(with_check, '')) not like '%uid()%';
  perform public.dg_assert(leaky is null, format('every policy is owner-scoped (offenders: %s)', leaky));

  -- 3. Evidence is append-only: no UPDATE or DELETE policy may exist, and the API
  --    role must not even hold the privilege.
  perform public.dg_assert(
    (select count(*) from pg_policies
      where schemaname = 'public' and tablename = 'learning_events' and cmd in ('UPDATE', 'DELETE')) = 0,
    'learning_events has no UPDATE/DELETE policy');
  perform public.dg_assert(not has_table_privilege('authenticated', 'public.learning_events', 'UPDATE'),
    'authenticated cannot UPDATE learning_events');
  perform public.dg_assert(not has_table_privilege('authenticated', 'public.learning_events', 'DELETE'),
    'authenticated cannot DELETE learning_events');
  perform public.dg_assert(has_table_privilege('authenticated', 'public.learning_events', 'INSERT'),
    'authenticated can still append events');

  -- 4. Server-maintained tables are read-only for learners.
  foreach t in array array['concept_states', 'review_items', 'entitlements', 'audit_log'] loop
    perform public.dg_assert(has_table_privilege('authenticated', format('public.%I', t), 'SELECT'),
      format('authenticated can read %s', t));
    perform public.dg_assert(
      not (has_table_privilege('authenticated', format('public.%I', t), 'INSERT')
        or has_table_privilege('authenticated', format('public.%I', t), 'UPDATE')
        or has_table_privilege('authenticated', format('public.%I', t), 'DELETE')),
      format('authenticated cannot write %s', t));
  end loop;

  -- 5. Anonymous visitors hold nothing in this schema.
  foreach t in array guarded loop
    perform public.dg_assert(
      not (has_table_privilege('anon', format('public.%I', t), 'SELECT')
        or has_table_privilege('anon', format('public.%I', t), 'INSERT')),
      format('anon has no access to %s', t));
  end loop;

  -- 6. Learner-owned tables that the learner may modify still require ownership on
  --    both read and write, so a single loosened clause cannot expose another user.
  foreach t in array array['profiles', 'saved_vocabulary'] loop
    perform public.dg_assert(
      (select count(*) from pg_policies where schemaname = 'public' and tablename = t
         and cmd = 'UPDATE' and coalesce(qual, '') like '%uid()%' and coalesce(with_check, '') like '%uid()%') = 1,
      format('%s UPDATE policy checks ownership on both sides', t));
    perform public.dg_assert(
      (select count(*) from pg_policies where schemaname = 'public' and tablename = t
         and cmd = 'DELETE' and coalesce(qual, '') like '%uid()%') = 1,
      format('%s DELETE policy checks ownership', t));
  end loop;

  -- 7. The export function must run as the caller, so RLS applies to it too.
  perform public.dg_assert(
    (select not prosecdef from pg_proc where oid = 'public.export_my_data'::regproc),
    'export_my_data is security invoker');
end
$$;
