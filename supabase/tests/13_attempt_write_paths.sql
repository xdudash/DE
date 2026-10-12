-- The write paths used by apps/web/lib/data/attempt-store.ts, verified as SQL.
-- Keep the statements here identical in shape to the ones the store issues: this file
-- is what proves the schema accepts them and refuses everything else.
\set ON_ERROR_STOP on
\pset tuples_only on
\o /dev/null
\set U '33333333-3333-4333-8333-333333333333'
\set OTHER '44444444-4444-4444-8444-444444444444'
\set EVENT '55555555-5555-4555-8555-555555555555'
\set CLAIMS '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}'

insert into auth.users (id, email) values (:'U', 'u@example.test'), (:'OTHER', 'o@example.test');
set role service_role;
insert into public.profiles (user_id, explanation_lang) values (:'U', 'uk'), (:'OTHER', 'ru');
reset role;

-- ------------------------------------------------ the learner inserts its own event
set role authenticated;
-- Session-level, not `set local`: psql commits each statement, so a transaction-scoped
-- setting would vanish before the next one. The app sets the same GUC inside one
-- transaction (apps/web/lib/data/pg.ts), which is the equivalent there.
set request.jwt.claims = :'CLAIMS';

do $$
declare n integer;
begin
  insert into public.learning_events
    (id, user_id, kind, occurred_at, content_id, local_id, content_version,
     concept_ids, signals, skill, correct, score, evaluator_version)
  values ('55555555-5555-4555-8555-555555555555', '33333333-3333-4333-8333-333333333333',
          'attempt'::dg_event_kind, now(), 'unit.syntax.v2_declarative.a1', 'x_order_vienna', '1.0.0',
          '{concept.syntax.v2_declarative}', '{}', 'knowledge'::dg_skill, true, 1.000, '1.0.0')
  on conflict (id) do nothing;
  get diagnostics n = row_count;
  perform public.dg_assert(n = 1, 'learner inserts its own attempt');

  -- The offline queue retries: the same id must not create a second row.
  insert into public.learning_events
    (id, user_id, kind, occurred_at, content_id, local_id, content_version,
     concept_ids, signals, skill, correct, score, evaluator_version)
  values ('55555555-5555-4555-8555-555555555555', '33333333-3333-4333-8333-333333333333',
          'attempt'::dg_event_kind, now(), 'unit.syntax.v2_declarative.a1', 'x_order_vienna', '1.0.0',
          '{concept.syntax.v2_declarative}', '{}', 'knowledge'::dg_skill, true, 1.000, '1.0.0')
  on conflict (id) do nothing;
  get diagnostics n = row_count;
  perform public.dg_assert(n = 0, 'replaying an event id inserts nothing');
  perform public.dg_assert((select count(*) from public.learning_events) = 1,
    'exactly one event stored (RLS scopes this count to the learner)');
end
$$;

-- The read the store performs when recomputing state.
select public.dg_assert(
  (select count(*) from public.learning_events
    where concept_ids && '{concept.syntax.v2_declarative}'::text[]
       or signals && '{concept.syntax.v2_declarative}'::text[]) = 1,
  'overlap read finds the learner''s event');

-- ------------------------------------------------ what the learner must NOT be able to do
do $$
begin
  begin
    insert into public.learning_events
      (id, user_id, kind, occurred_at, content_id, content_version, skill, correct, evaluator_version)
    values (gen_random_uuid(), '44444444-4444-4444-8444-444444444444', 'attempt'::dg_event_kind, now(),
            'unit.syntax.v2_declarative.a1', '1.0.0', 'knowledge'::dg_skill, true, '1.0.0');
    perform public.dg_assert(false, 'inserting an event for another learner must fail');
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.concept_states (user_id, concept_id, state, because, engine_version)
    values ('33333333-3333-4333-8333-333333333333', 'concept.syntax.v2_declarative',
            'provisionally_mastered'::dg_concept_state, 'self-declared', '1.0.0');
    perform public.dg_assert(false, 'a learner must not write its own derived state');
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.review_items (user_id, item_ref, interval_days, anchor_at, due_at)
    values ('33333333-3333-4333-8333-333333333333', 'concept.syntax.v2_declarative', 35, now(), now() + interval '35 days');
    perform public.dg_assert(false, 'a learner must not write its own review schedule');
  exception when insufficient_privilege then null;
  end;
end
$$;
reset role;

-- ------------------------------------------------ the server upserts derived rows
set role service_role;
do $$
declare n integer;
begin
  insert into public.concept_states (user_id, concept_id, state, because, evidence, engine_version, updated_at)
  select '33333333-3333-4333-8333-333333333333', u.concept_id, u.state::dg_concept_state, u.because, u.evidence, u.engine_version, now()
    from jsonb_to_recordset('[{"concept_id":"concept.syntax.v2_declarative","state":"in_progress","because":"practising","evidence":{"attempts":1},"engine_version":"1.0.0"}]'::jsonb)
         as u(concept_id text, state text, because text, evidence jsonb, engine_version text)
  on conflict (user_id, concept_id) do update
    set state = excluded.state, because = excluded.because, evidence = excluded.evidence,
        engine_version = excluded.engine_version, updated_at = now();
  get diagnostics n = row_count;
  perform public.dg_assert(n = 1, 'service role inserts derived state');

  -- Second pass with a different verdict: the cache is replaced, never duplicated.
  insert into public.concept_states (user_id, concept_id, state, because, evidence, engine_version, updated_at)
  select '33333333-3333-4333-8333-333333333333', u.concept_id, u.state::dg_concept_state, u.because, u.evidence, u.engine_version, now()
    from jsonb_to_recordset('[{"concept_id":"concept.syntax.v2_declarative","state":"needs_practice","because":"low_recent_accuracy","evidence":{"attempts":4},"engine_version":"1.0.0"}]'::jsonb)
         as u(concept_id text, state text, because text, evidence jsonb, engine_version text)
  on conflict (user_id, concept_id) do update
    set state = excluded.state, because = excluded.because, evidence = excluded.evidence,
        engine_version = excluded.engine_version, updated_at = now();
  -- The service role bypasses RLS, so scope these to this file's learner explicitly.
  perform public.dg_assert(
    (select count(*) from public.concept_states
      where user_id = '33333333-3333-4333-8333-333333333333') = 1,
    'derived state is replaced, not duplicated');
  perform public.dg_assert(
    (select state::text from public.concept_states
      where user_id = '33333333-3333-4333-8333-333333333333'
        and concept_id = 'concept.syntax.v2_declarative') = 'needs_practice',
    'derived state reflects the latest recomputation');

  insert into public.review_items (user_id, item_ref, step, interval_days, anchor_at, due_at, updated_at)
  select '33333333-3333-4333-8333-333333333333', u.item_ref, u.step, u.interval_days, u.anchor_at, u.due_at, now()
    from jsonb_to_recordset('[{"item_ref":"concept.syntax.v2_declarative","step":0,"interval_days":1,"anchor_at":"2026-10-12T09:00:00Z","due_at":"2026-10-13T09:00:00Z"}]'::jsonb)
         as u(item_ref text, step smallint, interval_days smallint, anchor_at timestamptz, due_at timestamptz)
  on conflict (user_id, item_ref) do update
    set step = excluded.step, interval_days = excluded.interval_days,
        anchor_at = excluded.anchor_at, due_at = excluded.due_at, updated_at = now();
  perform public.dg_assert(
    (select interval_days from public.review_items
      where user_id = '33333333-3333-4333-8333-333333333333') = 1,
    'service role writes the review schedule');
end
$$;
reset role;

-- ------------------------------------------------ the learner reads what the server wrote
set role authenticated;
set request.jwt.claims = :'CLAIMS';
select public.dg_assert((select state::text from public.concept_states) = 'needs_practice', 'learner reads its derived state');
select public.dg_assert((select count(*) from public.review_items) = 1, 'learner reads its review schedule');
reset role;
