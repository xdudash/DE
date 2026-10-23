-- Fixed-window request counters for write endpoints (DG-027, ADR-0017 Q7).
--
-- Keys are built by apps/web/lib/rate-limit: policy, a hashed subject (learner or client
-- address, never the raw value) and the window start. Rows are written only by the
-- service role and are deleted once their window has passed (expires_at), so the table
-- holds counters for minutes, not history. No learner content is stored here.

create table public.rate_limits (
  key text primary key check (char_length(key) between 1 and 300),
  hits integer not null default 0 check (hits >= 0),
  expires_at timestamptz not null
);
comment on table public.rate_limits is 'Request counters per policy, hashed subject and window. Service role only. Expired rows are deleted.';
create index rate_limits_expires_at on public.rate_limits (expires_at);

alter table public.rate_limits enable row level security;
-- No policies: learners and anonymous visitors cannot see or change any counter.
revoke all on public.rate_limits from anon, authenticated;
grant select, insert, update, delete on public.rate_limits to service_role;
