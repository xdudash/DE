-- Daily reminder subscriptions (ADR-0015).
-- Spec: docs/development/REMINDERS_SETUP.md · Decision: ADR-0015.
--
-- A push endpoint identifies one browser or device, so a row is personal data:
-- it belongs to the learner and is removed with the account (ON DELETE CASCADE).
-- The learner can add and remove their own rows; nobody can edit them. The sender
-- (the daily cron) writes last_sent_on with the service role, so the once-a-day
-- guarantee cannot be bypassed from the client.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) between 8 and 2048 and endpoint like 'https://%'),
  p256dh text not null check (char_length(p256dh) between 40 and 200),
  auth text not null check (char_length(auth) between 16 and 64),
  -- Language of the reminder text, from the interface the learner chose.
  ui_lang text not null default 'en' check (ui_lang ~ '^[a-z]{2,3}$'),
  created_at timestamptz not null default now(),
  last_sent_on date
);
comment on table public.push_subscriptions is 'Push endpoints for the daily reminder. Personal data: removed with the account.';
create index push_subscriptions_user on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy push_subscriptions_select_own on public.push_subscriptions for select using (auth.uid() = user_id);
create policy push_subscriptions_insert_own on public.push_subscriptions for insert with check (auth.uid() = user_id);
create policy push_subscriptions_delete_own on public.push_subscriptions for delete using (auth.uid() = user_id);

-- No UPDATE for learners: last_sent_on belongs to the sender. Anonymous visitors touch nothing.
revoke all on public.push_subscriptions from anon;
revoke update, truncate on public.push_subscriptions from authenticated;
grant select, insert, delete on public.push_subscriptions to authenticated;
