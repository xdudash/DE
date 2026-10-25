/**
 * PostgreSQL implementation of the attempts storage port.
 *
 * Which context writes what follows the schema, not convenience:
 *   learning_events  — inserted as the learner (RLS checks user_id); append-only,
 *                      so a replayed id is ignored rather than updated.
 *   concept_states / review_items — derived caches the learner may read but not
 *                      write, so they are upserted with the service role.
 */
import "server-only";
import type { ConceptStateRow, ReviewRow, Store, StoredEvent } from "@deutschgo/attempts";
import type { LearningEvent } from "@deutschgo/learning-engine";
import { withLearner, withService } from "./pg.ts";

export function attemptStore(userId: string): Store {
  return {
    async insertEvent(event: StoredEvent) {
      if (event.userId !== userId) throw new Error("event belongs to another learner");
      const { rowCount } = await withLearner(userId, (c) =>
        c.query(
          `insert into public.learning_events
             (id, user_id, kind, occurred_at, content_id, local_id, content_version,
              concept_ids, signals, skill, correct, score, evaluator_version)
           values ($1, $2, $3::dg_event_kind, $4, $5, $6, $7, $8, $9, $10::dg_skill, $11, $12, $13)
           on conflict (id) do nothing`,
          [
            event.id, userId, event.kind, event.occurredAt, event.contentId, event.localId,
            event.contentVersion, event.conceptIds, event.signals, event.skill,
            event.correct, event.score, event.evaluatorVersion,
          ],
        ),
      );
      return { inserted: rowCount === 1 };
    },

    async insertEvents(events: StoredEvent[]) {
      if (events.some((event) => event.userId !== userId)) throw new Error("event belongs to another learner");
      if (events.length === 0) return 0;
      const { rowCount } = await withLearner(userId, (c) =>
        c.query(
          `insert into public.learning_events
             (id, user_id, kind, occurred_at, content_id, local_id, content_version,
              concept_ids, signals, skill, correct, score, evaluator_version)
           select u.id, $1, u.kind::dg_event_kind, u.occurred_at, u.content_id, u.local_id, u.content_version,
                  u.concept_ids, u.signals, u.skill::dg_skill, u.correct, u.score, u.evaluator_version
             from jsonb_to_recordset($2::jsonb)
                  as u(id uuid, kind text, occurred_at timestamptz, content_id text, local_id text,
                       content_version text, concept_ids text[], signals text[], skill text, correct boolean,
                       score numeric, evaluator_version text)
           on conflict (id) do nothing`,
          [userId, JSON.stringify(events.map(({ userId: _userId, ...event }) => ({
            id: event.id, kind: event.kind, occurred_at: event.occurredAt, content_id: event.contentId,
            local_id: event.localId, content_version: event.contentVersion, concept_ids: event.conceptIds,
            signals: event.signals, skill: event.skill, correct: event.correct, score: event.score,
            evaluator_version: event.evaluatorVersion,
          })))],
        ),
      );
      return rowCount ?? 0;
    },

    async eventsForConcepts(conceptIds: string[]): Promise<LearningEvent[]> {
      const { rows } = await withLearner(userId, (c) =>
        c.query(
          `select id, kind::text, occurred_at, content_id, local_id, concept_ids, signals, skill::text, correct
             from public.learning_events
            where concept_ids && $1::text[] or signals && $1::text[]
            order by occurred_at, id`,
          [conceptIds],
        ),
      );
      return rows.map((r) => {
        const e: LearningEvent = {
          id: r.id,
          kind: r.kind,
          at: new Date(r.occurred_at).getTime(),
          contentId: r.content_id,
          conceptIds: r.concept_ids,
          signals: r.signals,
          skill: r.skill,
        };
        if (r.local_id !== null) e.localId = r.local_id;
        if (r.correct !== null) e.correct = r.correct;
        return e;
      });
    },

    async saveConceptStates(rows: ConceptStateRow[]): Promise<void> {
      if (rows.length === 0) return;
      await withService((c) =>
        c.query(
          `insert into public.concept_states (user_id, concept_id, state, because, evidence, engine_version, updated_at)
           select $1, u.concept_id, u.state::dg_concept_state, u.because, u.evidence, u.engine_version, now()
             from jsonb_to_recordset($2::jsonb)
                  as u(concept_id text, state text, because text, evidence jsonb, engine_version text)
           on conflict (user_id, concept_id) do update
             set state = excluded.state, because = excluded.because, evidence = excluded.evidence,
                 engine_version = excluded.engine_version, updated_at = now()`,
          // Keys are the SQL column names: the domain rows are camelCase, and a mismatch
          // silently writes NULL (found by the integration suite once it actually ran).
          [userId, JSON.stringify(rows.map((r) => ({
            concept_id: r.conceptId, state: r.state, because: r.because,
            evidence: r.evidence, engine_version: r.engineVersion,
          })))],
        ),
      );
    },

    async saveReviewItems(rows: ReviewRow[]): Promise<void> {
      if (rows.length === 0) return;
      await withService((c) =>
        c.query(
          `insert into public.review_items (user_id, item_ref, step, interval_days, anchor_at, due_at, updated_at)
           select $1, u.item_ref, u.step, u.interval_days, u.anchor_at, u.due_at, now()
             from jsonb_to_recordset($2::jsonb)
                  as u(item_ref text, step smallint, interval_days smallint, anchor_at timestamptz, due_at timestamptz)
           on conflict (user_id, item_ref) do update
             set step = excluded.step, interval_days = excluded.interval_days,
                 anchor_at = excluded.anchor_at, due_at = excluded.due_at, updated_at = now()`,
          [userId, JSON.stringify(rows.map((r) => ({
            item_ref: r.itemRef, step: r.step, interval_days: r.intervalDays,
            anchor_at: r.anchorAt, due_at: r.dueAt,
          })))],
        ),
      );
    },
  };
}
