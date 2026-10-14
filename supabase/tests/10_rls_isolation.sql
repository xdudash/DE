-- RLS isolation and append-only guarantees.
-- Every block raises an exception on failure; the runner uses ON_ERROR_STOP=1.
\set ON_ERROR_STOP on
\pset tuples_only on
\o /dev/null
\set A '11111111-1111-4111-8111-111111111111'
\set B '22222222-2222-4222-8222-222222222222'

insert into auth.users (id, email) values (:'A', 'a@example.test'), (:'B', 'b@example.test');

-- Seed as the service role (bypasses RLS, like the server does).
set role service_role;
insert into public.profiles (user_id, explanation_lang) values (:'A', 'uk'), (:'B', 'ru');
insert into public.entitlements (user_id, tier) values (:'A', 'premium'), (:'B', 'free');
insert into public.learning_events (id, user_id, kind, occurred_at, content_id, local_id, content_version, concept_ids, skill, correct, evaluator_version)
values (gen_random_uuid(), :'A', 'attempt', now(), 'unit.syntax.v2_declarative.a1', 'x_choose_correct', '1.0.0', '{concept.syntax.v2_declarative}', 'knowledge', true, 'eval-1'),
       (gen_random_uuid(), :'B', 'attempt', now(), 'unit.syntax.v2_declarative.a1', 'x_choose_correct', '1.0.0', '{concept.syntax.v2_declarative}', 'knowledge', false, 'eval-1');
insert into public.concept_states (user_id, concept_id, state, because, engine_version)
values (:'A', 'concept.syntax.v2_declarative', 'in_progress', 'practising', 'engine-1'),
       (:'B', 'concept.syntax.v2_declarative', 'needs_practice', 'low_recent_accuracy', 'engine-1');
reset role;

-- ----------------------------------------------------------- A sees only A
set role authenticated;
set request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select public.dg_assert((select count(*) from public.profiles) = 1, 'A sees exactly one profile');
select public.dg_assert((select user_id from public.profiles) = '11111111-1111-4111-8111-111111111111'::uuid, 'A sees its own profile');
select public.dg_assert((select count(*) from public.learning_events) = 1, 'A sees only its own events');
select public.dg_assert((select count(*) from public.concept_states) = 1, 'A sees only its own states');
select public.dg_assert((select tier::text from public.entitlements) = 'premium', 'A sees its own entitlement');

-- A cannot change or delete anything belonging to B: RLS makes those rows invisible,
-- so the statements affect zero rows rather than failing.
do $$
declare n integer;
begin
  update public.profiles set explanation_lang = 'en' where user_id = '22222222-2222-4222-8222-222222222222';
  get diagnostics n = row_count;
  perform public.dg_assert(n = 0, 'A cannot update B profile');

  delete from public.profiles where user_id = '22222222-2222-4222-8222-222222222222';
  get diagnostics n = row_count;
  perform public.dg_assert(n = 0, 'A cannot delete B profile');

  delete from public.saved_vocabulary where user_id = '22222222-2222-4222-8222-222222222222';
  get diagnostics n = row_count;
  perform public.dg_assert(n = 0, 'A cannot delete B vocabulary');
end
$$;

-- A cannot insert rows owned by B.
do $$
begin
  begin
    insert into public.learning_events (id, user_id, kind, occurred_at, content_id, content_version, skill, correct, evaluator_version)
    values (gen_random_uuid(), '22222222-2222-4222-8222-222222222222', 'attempt', now(), 'unit.syntax.v2_declarative.a1', '1.0.0', 'knowledge', true, 'eval-1');
    raise exception 'ASSERTION FAILED: A could insert an event for B';
  exception when insufficient_privilege then null;
  end;
end
$$;

-- Append-only: no UPDATE/DELETE policy exists for learners.
do $$
begin
  begin
    update public.learning_events set correct = false where user_id = '11111111-1111-4111-8111-111111111111';
    raise exception 'ASSERTION FAILED: own events were updatable';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.learning_events where user_id = '11111111-1111-4111-8111-111111111111';
    raise exception 'ASSERTION FAILED: own events were deletable';
  exception when insufficient_privilege then null;
  end;
end
$$;

-- Entitlements are read-only for learners (no self-upgrade to premium).
do $$
begin
  begin
    update public.entitlements set tier = 'premium' where user_id = '11111111-1111-4111-8111-111111111111';
    raise exception 'ASSERTION FAILED: learner could change its entitlement';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.entitlements (user_id, tier) values ('11111111-1111-4111-8111-111111111111', 'premium');
    raise exception 'ASSERTION FAILED: learner could insert an entitlement';
  exception when insufficient_privilege then null;
  end;
end
$$;

-- Derived tables are server-maintained; learners may only read them.
do $$
begin
  begin
    insert into public.concept_states (user_id, concept_id, state, because, engine_version)
    values ('11111111-1111-4111-8111-111111111111', 'concept.syntax.w_questions', 'in_progress', 'practising', 'engine-1');
    raise exception 'ASSERTION FAILED: learner could write concept_states';
  exception when insufficient_privilege then null;
  end;
end
$$;

-- Own writes that SHOULD work.
insert into public.saved_vocabulary (user_id, lemma, sense_id, context_sentence, explanation_lang)
values ('11111111-1111-4111-8111-111111111111', 'die Vermieterin', 'sense.landlady', 'Heute rufe ich meine Vermieterin an.', 'uk');
select public.dg_assert((select count(*) from public.saved_vocabulary) = 1, 'A can save its own vocabulary');

insert into public.learning_events (id, user_id, kind, occurred_at, content_id, content_version, concept_ids, skill, correct, evaluator_version)
values ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'recall', now(), 'unit.syntax.v2_declarative.a1', '1.0.0', '{concept.syntax.v2_declarative}', 'knowledge', true, 'eval-1');
select public.dg_assert((select count(*) from public.learning_events) = 2, 'A can append its own event');

-- Export returns only the caller's data.
select public.dg_assert(
  (select jsonb_array_length(public.export_my_data() -> 'learning_events')) = 2, 'export contains only A events');
select public.dg_assert(
  (select public.export_my_data() -> 'profile' ->> 'explanation_lang') = 'uk', 'export contains A profile');

-- ----------------------------------------------------------- anonymous access
reset role;
set role anon;
set request.jwt.claims = '{"role":"anon"}';
do $$
begin
  begin
    perform 1 from public.profiles;
    raise exception 'ASSERTION FAILED: anon could query profiles';
  exception when insufficient_privilege then null;
  end;
end
$$;

-- ----------------------------------------------------------- B is unaffected
reset role;
set role authenticated;
set request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select public.dg_assert((select count(*) from public.learning_events) = 1, 'B still has exactly its own event');
select public.dg_assert((select explanation_lang from public.profiles) = 'ru', 'B profile was not modified by A');
select public.dg_assert((select count(*) from public.saved_vocabulary) = 0, 'B sees no vocabulary from A');
reset role;
