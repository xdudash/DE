-- DeutschGo learner-data schema, initial migration.
-- Spec: docs/architecture/DATA_AND_PRIVACY.md · Decision: ADR-0002.
--
-- Invariants enforced here (not only in application code):
--   * every table carries row-level security; the owner is auth.uid()
--   * learning_events is append-only: no UPDATE/DELETE policy exists for users
--   * entitlements are readable by the owner but writable only by the service role
--   * nothing in this file stores free text the learner did not deliberately save
--
-- Portability: only standard PostgreSQL plus `auth.uid()` / `auth.role()`, which
-- Supabase provides and `supabase/tests/00_auth_shim.sql` emulates locally.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums
create type dg_event_kind as enum ('exposure', 'attempt', 'recall', 'transfer', 'self_report');
create type dg_skill as enum ('knowledge', 'reading', 'listening', 'writing', 'speaking');
create type dg_concept_state as enum (
  'unseen', 'available', 'in_progress', 'needs_practice', 'review_due', 'provisionally_mastered'
);
create type dg_region as enum ('standard', 'de-DE', 'de-AT', 'de-CH');
create type dg_goal as enum ('general', 'everyday', 'work', 'study', 'exam');
create type dg_tier as enum ('free', 'premium');

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 60),
  ui_lang text not null default 'en' check (ui_lang ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?$'),
  explanation_lang text not null default 'en' check (explanation_lang ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?$'),
  region dg_region not null default 'standard',
  goals dg_goal[] not null default '{general}',
  weekly_minutes integer not null default 60 check (weekly_minutes between 5 and 3000),
  -- Age gate (16+) is stored as a boolean assertion, never a birth date.
  age_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Learner settings. No birth date, nationality or immigration status is ever collected.';

-- ---------------------------------------------------------------- learning events
create table public.learning_events (
  -- Client-generated so that an offline queue can retry without duplicating.
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind dg_event_kind not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  content_id text not null check (content_id ~ '^(concept|unit|route)\.[a-z0-9]+(\.[a-z0-9_]+)+$'),
  local_id text check (local_id ~ '^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$'),
  content_version text not null check (content_version ~ '^\d+\.\d+\.\d+$'),
  concept_ids text[] not null default '{}',
  signals text[] not null default '{}',
  skill dg_skill not null default 'knowledge',
  -- NULL for exposure/self_report; set by the SERVER evaluator for graded kinds.
  correct boolean,
  score numeric(4, 3) check (score is null or (score >= 0 and score <= 1)),
  evaluator_version text not null,
  constraint graded_events_have_a_result check (
    (kind in ('attempt', 'recall', 'transfer')) = (correct is not null)
  ),
  constraint signals_only_on_wrong_answers check (
    cardinality(signals) = 0 or correct is false
  ),
  constraint occurred_at_not_absurdly_future check (occurred_at < received_at + interval '1 day')
);
comment on table public.learning_events is 'Append-only evidence. Derived states are recomputed from these rows; never updated in place.';
create index learning_events_user_time on public.learning_events (user_id, occurred_at desc);
-- btree_gin would be needed to combine uuid with an array in one GIN index; a plain
-- array index plus the (user_id, occurred_at) index above is enough at this scale.
create index learning_events_concepts on public.learning_events using gin (concept_ids);

-- ---------------------------------------------------------------- derived state
create table public.concept_states (
  user_id uuid not null references auth.users (id) on delete cascade,
  concept_id text not null check (concept_id ~ '^concept\.[a-z0-9]+(\.[a-z0-9_]+)+$'),
  state dg_concept_state not null,
  because text not null,
  evidence jsonb not null default '{}'::jsonb,
  engine_version text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, concept_id)
);
comment on table public.concept_states is 'Cache of packages/learning-engine output; safe to delete and recompute from learning_events.';

create table public.review_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_ref text not null,
  step smallint not null default 0 check (step >= 0),
  interval_days smallint not null check (interval_days > 0),
  anchor_at timestamptz not null,
  due_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_ref)
);
create index review_items_due on public.review_items (user_id, due_at);

create table public.saved_vocabulary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lemma text not null check (char_length(lemma) between 1 and 120),
  sense_id text,
  context_sentence text check (context_sentence is null or char_length(context_sentence) <= 500),
  source_ref text,
  explanation_lang text not null check (explanation_lang ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?$'),
  created_at timestamptz not null default now(),
  unique (user_id, lemma, sense_id)
);
comment on column public.saved_vocabulary.context_sentence is 'Copied only from content DeutschGo is licensed to display.';

-- ---------------------------------------------------------------- entitlements, audit
create table public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tier dg_tier not null default 'free',
  source text not null default 'default',
  valid_until timestamptz,
  updated_at timestamptz not null default now()
);
comment on table public.entitlements is 'Written only by the service role (billing webhooks); never by the learner.';

create table public.audit_log (
  id bigserial primary key,
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  at timestamptz not null default now()
);
comment on table public.audit_log is 'Account-level actions (export, deletion). Never learning content or free text.';

-- ---------------------------------------------------------------- updated_at
create or replace function public.dg_touch_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.dg_touch_updated_at();
create trigger concept_states_touch before update on public.concept_states
  for each row execute function public.dg_touch_updated_at();
create trigger review_items_touch before update on public.review_items
  for each row execute function public.dg_touch_updated_at();

-- ---------------------------------------------------------------- RLS
alter table public.profiles enable row level security;
alter table public.learning_events enable row level security;
alter table public.concept_states enable row level security;
alter table public.review_items enable row level security;
alter table public.saved_vocabulary enable row level security;
alter table public.entitlements enable row level security;
alter table public.audit_log enable row level security;

-- Owner-only read/write for learner-owned tables.
create policy profiles_select_own on public.profiles for select using (auth.uid() = user_id);
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = user_id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy profiles_delete_own on public.profiles for delete using (auth.uid() = user_id);

-- Append-only: SELECT and INSERT only. No UPDATE/DELETE policy exists on purpose.
create policy learning_events_select_own on public.learning_events for select using (auth.uid() = user_id);
create policy learning_events_insert_own on public.learning_events for insert with check (auth.uid() = user_id);

create policy concept_states_select_own on public.concept_states for select using (auth.uid() = user_id);
create policy review_items_select_own on public.review_items for select using (auth.uid() = user_id);

create policy saved_vocabulary_select_own on public.saved_vocabulary for select using (auth.uid() = user_id);
create policy saved_vocabulary_insert_own on public.saved_vocabulary for insert with check (auth.uid() = user_id);
create policy saved_vocabulary_update_own on public.saved_vocabulary for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy saved_vocabulary_delete_own on public.saved_vocabulary for delete using (auth.uid() = user_id);

-- Read-only for the learner; the service role bypasses RLS and writes these.
create policy entitlements_select_own on public.entitlements for select using (auth.uid() = user_id);
create policy audit_log_select_own on public.audit_log for select using (auth.uid() = user_id);

-- Defence in depth: besides the missing policies, take the privileges away from the
-- API roles, so an accidental blanket GRANT cannot re-open these paths. Without this,
-- a forbidden UPDATE merely affects zero rows; with it, the attempt is an error.
do $$
declare api_roles text := '';
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then api_roles := 'authenticated'; end if;
  if exists (select 1 from pg_roles where rolname = 'anon') then
    api_roles := case when api_roles = '' then 'anon' else api_roles || ', anon' end;
  end if;
  if api_roles = '' then
    raise notice 'Neither authenticated nor anon exists; skipping API-role revokes.';
    return;
  end if;

  -- Evidence is append-only.
  execute format('revoke update, delete, truncate on public.learning_events from %s', api_roles);
  -- Derived state and entitlements are written by the server only.
  execute format('revoke insert, update, delete, truncate on public.concept_states, public.review_items, public.entitlements, public.audit_log from %s', api_roles);
  -- Anonymous visitors touch nothing in this schema.
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on all tables in schema public from anon';
  end if;
end
$$;

revoke all on public.concept_states, public.review_items, public.entitlements, public.audit_log from public;

-- ---------------------------------------------------------------- data export (GDPR)
create or replace function public.export_my_data() returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from public.profiles p where p.user_id = auth.uid()),
    'learning_events', coalesce((select jsonb_agg(to_jsonb(e) order by e.occurred_at)
                                 from public.learning_events e where e.user_id = auth.uid()), '[]'::jsonb),
    'concept_states', coalesce((select jsonb_agg(to_jsonb(s) order by s.concept_id)
                                from public.concept_states s where s.user_id = auth.uid()), '[]'::jsonb),
    'review_items', coalesce((select jsonb_agg(to_jsonb(r) order by r.item_ref)
                              from public.review_items r where r.user_id = auth.uid()), '[]'::jsonb),
    'saved_vocabulary', coalesce((select jsonb_agg(to_jsonb(v) order by v.created_at)
                                  from public.saved_vocabulary v where v.user_id = auth.uid()), '[]'::jsonb),
    'entitlements', (select to_jsonb(t) from public.entitlements t where t.user_id = auth.uid())
  );
$$;
comment on function public.export_my_data is 'Self-service GDPR export; security invoker so RLS still applies.';
