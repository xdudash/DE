-- LOCAL TEST ONLY. Emulates the parts of Supabase's auth schema that the
-- migrations depend on, so the same SQL can be verified without the hosted
-- platform. Never applied to a Supabase project (it already provides these).
create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key,
  email text unique
);

-- Supabase exposes the JWT as the request.jwt.claims GUC; tests set it directly.
create or replace function auth.uid() returns uuid
language sql stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid;
$$;

create or replace function auth.role() returns text
language sql stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'role', ''), 'anon');
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant select on auth.users to authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

-- Supabase grants its API roles broad privileges on anything created in `public`
-- via default privileges. Replicating that here means the migrations' own REVOKEs
-- are what protects the data — exactly as on the hosted project.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
