/**
 * Records one attempt (ARCHITECTURE.md, data flow 2):
 *   resolve exercise from the compiled bundle → re-evaluate on the server →
 *   append an immutable event → recompute derived state → return result + state.
 *
 * The client's own verdict is never trusted, and nothing here mutates an event.
 */
import { unitExercises } from "@deutschgo/content-kit";
import type { ContentBundle, Exercise, Unit } from "@deutschgo/content-kit";
import { EVALUATOR_VERSION, EvaluationError, evaluate, signalledConcepts } from "@deutschgo/content-kit/evaluate";
import { ENGINE_VERSION, deriveConceptStates, graphFromBundle } from "@deutschgo/learning-engine";
import type { LearningEvent } from "@deutschgo/learning-engine";
import { AttemptError } from "./errors.ts";
import type { AttemptOutcome, AttemptRequest, ConceptStateRow, ReviewRow, Store, StoredEvent } from "./types.ts";

export interface RecordDeps {
  bundle: ContentBundle;
  store: Store;
  userId: string;
  /** Server clock in epoch milliseconds; injected so tests are deterministic. */
  now: number;
}

function resolve(bundle: ContentBundle, req: AttemptRequest): { unit: Unit; exercise: Exercise } {
  const unit = bundle.units.find((u) => u.id === req.unitId);
  if (!unit) throw new AttemptError("unknown_content", `no unit "${req.unitId}" in this build`);
  if (unit.version !== req.contentVersion) {
    throw new AttemptError(
      "version_mismatch",
      `unit "${req.unitId}" is at ${unit.version}, the client sent ${req.contentVersion}`,
      "reload the lesson and try again",
    );
  }
  const exercise = unitExercises(unit).find((e) => e.id === req.exerciseId);
  if (!exercise) throw new AttemptError("unknown_content", `unit "${req.unitId}" has no exercise "${req.exerciseId}"`);
  return { unit, exercise };
}

/**
 * How far before the server clock a client may date an answer. Answers are sent as they
 * are given, so a few minutes covers slow networks and retries. Answers given while due
 * count as reviews (ADR-0016), so an unbounded past would let a client fake spaced
 * reviews in one sitting. The offline queue (DG-023) must replace this with a rule for
 * answers that wait on the device.
 */
export const MAX_CLIENT_LAG_MS = 15 * 60_000;

/**
 * The event time is the client's, clamped into [now − MAX_CLIENT_LAG_MS, now]: the schema
 * rejects far-future rows, and a learner must not be able to move a review in time.
 */
function eventTime(occurredAt: string, now: number): string {
  return new Date(Math.min(Math.max(Date.parse(occurredAt), now - MAX_CLIENT_LAG_MS), now)).toISOString();
}

export async function recordAttempt(req: AttemptRequest, deps: RecordDeps): Promise<AttemptOutcome> {
  const { bundle, store, userId, now } = deps;
  const { exercise } = resolve(bundle, req);

  let result;
  try {
    result = evaluate(exercise, req.response);
  } catch (err) {
    if (err instanceof EvaluationError) throw new AttemptError("response_mismatch", err.message);
    throw err;
  }

  const signals = signalledConcepts(result);
  const event: StoredEvent = {
    id: req.eventId,
    userId,
    kind: "attempt",
    occurredAt: eventTime(req.occurredAt, now),
    contentId: req.unitId,
    localId: req.exerciseId,
    contentVersion: req.contentVersion,
    conceptIds: exercise.concepts,
    signals,
    skill: "knowledge",
    correct: result.correct,
    score: result.score,
    evaluatorVersion: EVALUATOR_VERSION,
  };

  const { inserted } = await store.insertEvent(event);

  // Recompute from stored evidence rather than from this single result: the same code
  // path then serves sync, replays and algorithm changes.
  const affected = exercise.concepts;
  const events = await store.eventsForConcepts(affected);
  const statuses = deriveConceptStates(graphFromBundle(bundle), events, now);

  const stateRows: ConceptStateRow[] = [];
  const reviewRows: ReviewRow[] = [];
  for (const conceptId of affected) {
    const status = statuses.get(conceptId);
    if (!status) continue; // concept not in this build's graph; nothing derived
    stateRows.push({
      conceptId,
      state: status.state,
      because: status.because,
      evidence: status.evidence,
      engineVersion: ENGINE_VERSION,
    });
    const review = status.evidence.review;
    if (review) {
      reviewRows.push({
        itemRef: conceptId,
        step: review.step,
        intervalDays: review.intervalDays,
        anchorAt: new Date(review.anchorAt).toISOString(),
        dueAt: new Date(review.dueAt).toISOString(),
      });
    }
  }
  if (stateRows.length) await store.saveConceptStates(stateRows);
  if (reviewRows.length) await store.saveReviewItems(reviewRows);

  const nextDue = reviewRows.map((r) => r.dueAt).sort()[0];
  const outcome: AttemptOutcome = {
    recorded: inserted,
    correct: result.correct,
    score: result.score,
    feedback: result.feedback,
    explanation: exercise.explanation,
    states: stateRows,
  };
  if (result.ruleFeedback) outcome.ruleFeedback = result.ruleFeedback;
  if (result.gaps) outcome.gaps = result.gaps.map((g) => ({ index: g.index, correct: g.correct }));
  if (nextDue) outcome.nextReviewAt = nextDue;
  return outcome;
}

/** Re-derives everything for a learner, e.g. after an engine upgrade. */
export async function recomputeAll(deps: Omit<RecordDeps, "userId"> & { userId: string }): Promise<ConceptStateRow[]> {
  const graph = graphFromBundle(deps.bundle);
  const events: LearningEvent[] = await deps.store.eventsForConcepts(graph.map((c) => c.id));
  const statuses = deriveConceptStates(graph, events, deps.now);
  const rows = [...statuses.values()]
    .filter((s) => s.state !== "unseen" && s.state !== "available")
    .map((s) => ({ conceptId: s.conceptId, state: s.state, because: s.because, evidence: s.evidence, engineVersion: ENGINE_VERSION }));
  if (rows.length) await deps.store.saveConceptStates(rows);
  return rows;
}
