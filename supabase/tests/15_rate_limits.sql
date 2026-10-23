-- The rate-limit counters (supabase/migrations/0003_rate_limits.sql).
-- Only the service role may touch them; learners and anonymous visitors may not.
\set ON_ERROR_STOP on
\pset tuples_only on
\o /dev/null

set role anon;
do $$
begin
  begin
    perform 1 from public.rate_limits;
    perform public.dg_assert(false, 'anon cannot read rate_limits');
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

set role authenticated;
do $$
begin
  begin
    insert into public.rate_limits (key, hits, expires_at) values ('attempts:x:1', 1, now());
    perform public.dg_assert(false, 'authenticated cannot write rate_limits');
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

set role service_role;
insert into public.rate_limits (key, hits, expires_at) values ('attempts:test:1', 1, now() + interval '1 minute')
  on conflict (key) do update set hits = public.rate_limits.hits + 1;
insert into public.rate_limits (key, hits, expires_at) values ('attempts:test:1', 1, now() + interval '1 minute')
  on conflict (key) do update set hits = public.rate_limits.hits + 1;
do $$
begin
  perform public.dg_assert((select hits from public.rate_limits where key = 'attempts:test:1') = 2, 'service role counts hits');
end $$;
reset role;

\o
select 'rate_limits: ok';
