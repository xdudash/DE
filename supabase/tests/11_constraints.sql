-- Data-integrity constraints that protect the evidence model.
\set ON_ERROR_STOP on
\pset tuples_only on
\o /dev/null
\set U '44444444-4444-4444-8444-444444444444'
insert into auth.users (id, email) values (:'U', 'c@example.test');
set role service_role;
insert into public.profiles (user_id) values (:'U');

do $$
declare u uuid := '44444444-4444-4444-8444-444444444444';
begin
  -- Graded kinds must carry a result; non-graded kinds must not.
  begin
    insert into public.learning_events (id, user_id, kind, occurred_at, content_id, content_version, skill, evaluator_version)
    values (gen_random_uuid(), u, 'attempt', now(), 'unit.a.b.a1', '1.0.0', 'knowledge', 'eval-1');
    raise exception 'ASSERTION FAILED: attempt without a result was accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.learning_events (id, user_id, kind, occurred_at, content_id, content_version, skill, correct, evaluator_version)
    values (gen_random_uuid(), u, 'exposure', now(), 'unit.a.b.a1', '1.0.0', 'knowledge', true, 'eval-1');
    raise exception 'ASSERTION FAILED: exposure with a result was accepted';
  exception when check_violation then null;
  end;
  -- Signals only make sense on a wrong answer.
  begin
    insert into public.learning_events (id, user_id, kind, occurred_at, content_id, content_version, skill, correct, signals, evaluator_version)
    values (gen_random_uuid(), u, 'attempt', now(), 'unit.a.b.a1', '1.0.0', 'knowledge', true, '{concept.syntax.v2_declarative}', 'eval-1');
    raise exception 'ASSERTION FAILED: signals on a correct answer were accepted';
  exception when check_violation then null;
  end;
  -- Malformed content ids are rejected.
  begin
    insert into public.learning_events (id, user_id, kind, occurred_at, content_id, content_version, skill, correct, evaluator_version)
    values (gen_random_uuid(), u, 'attempt', now(), 'Unit Syntax', '1.0.0', 'knowledge', true, 'eval-1');
    raise exception 'ASSERTION FAILED: malformed content_id was accepted';
  exception when check_violation then null;
  end;
  -- Idempotency: the same client-generated id cannot be stored twice.
  insert into public.learning_events (id, user_id, kind, occurred_at, content_id, content_version, skill, correct, evaluator_version)
  values ('55555555-5555-4555-8555-555555555555', u, 'attempt', now(), 'unit.a.b.a1', '1.0.0', 'knowledge', true, 'eval-1');
  begin
    insert into public.learning_events (id, user_id, kind, occurred_at, content_id, content_version, skill, correct, evaluator_version)
    values ('55555555-5555-4555-8555-555555555555', u, 'attempt', now(), 'unit.a.b.a1', '1.0.0', 'knowledge', true, 'eval-1');
    raise exception 'ASSERTION FAILED: duplicate event id was accepted';
  exception when unique_violation then null;
  end;
end
$$;

-- Deleting the auth user cascades to all learner data (GDPR deletion).
-- Done as the owner, because deleting an account is a platform action, not an API one.
reset role;
delete from auth.users where id = :'U';
set role service_role;
select public.dg_assert((select count(*) from public.learning_events where user_id = :'U') = 0, 'events cascade on user deletion');
select public.dg_assert((select count(*) from public.profiles where user_id = :'U') = 0, 'profile cascades on user deletion');
reset role;
