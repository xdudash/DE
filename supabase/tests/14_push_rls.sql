-- Push subscriptions: owner-only rows, and no learner edits to the sender's column.
-- Every block raises an exception on failure; the runner uses ON_ERROR_STOP=1.
\set ON_ERROR_STOP on
\pset tuples_only on
\o /dev/null
\set P '33333333-3333-4333-8333-333333333333'
\set Q '44444444-4444-4444-8444-444444444444'

insert into auth.users (id, email) values (:'P', 'p@example.test'), (:'Q', 'q@example.test');

set role service_role;
insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, ui_lang) values
  (:'P', 'https://push.example.test/p', repeat('B', 87), repeat('a', 22), 'uk'),
  (:'Q', 'https://push.example.test/q', repeat('B', 87), repeat('a', 22), 'ru');
reset role;

-- ----------------------------------------------------------- P sees only P
set role authenticated;
set request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';

select public.dg_assert((select count(*) from public.push_subscriptions) = 1, 'P sees exactly one push subscription');
select public.dg_assert((select endpoint from public.push_subscriptions) = 'https://push.example.test/p', 'P sees its own endpoint');

-- P cannot delete Q's subscription: the row is invisible, so nothing is removed.
do $$
declare n integer;
begin
  delete from public.push_subscriptions where user_id = '44444444-4444-4444-8444-444444444444';
  get diagnostics n = row_count;
  perform public.dg_assert(n = 0, 'P cannot delete Q subscription');
end
$$;

-- P cannot subscribe on behalf of Q.
do $$
begin
  begin
    insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
    values ('44444444-4444-4444-8444-444444444444', 'https://push.example.test/forged', repeat('B', 87), repeat('a', 22));
    raise exception 'ASSERTION FAILED: P could subscribe for Q';
  exception when insufficient_privilege then null;
  end;
end
$$;

-- P cannot move last_sent_on: learners have no UPDATE on this table at all.
do $$
begin
  begin
    update public.push_subscriptions set last_sent_on = current_date;
    raise exception 'ASSERTION FAILED: learner could update push_subscriptions';
  exception when insufficient_privilege then null;
  end;
end
$$;

-- P can remove its own subscription.
do $$
declare n integer;
begin
  delete from public.push_subscriptions where endpoint = 'https://push.example.test/p';
  get diagnostics n = row_count;
  perform public.dg_assert(n = 1, 'P can delete its own subscription');
end
$$;

reset role;
