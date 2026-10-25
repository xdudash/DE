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
/** Maximum local history accepted in one learner-initiated import. */
export const MAX_IMPORT_ATTEMPTS = 2_000;

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

export interface ImportOutcome {
  /** New, server-evaluated events written to the account. */
  imported: number;
  /** Replayed ids, including identical duplicate ids in the input batch. */
  duplicates: number;
  /** Current derived state for concepts touched by the import. */
  states: ConceptStateRow[];
}

/**
 * Re-evaluates a locally stored batch before writing anything. Client timestamps are
 * deliberately replaced by the server import time: device history is user-controlled,
 * so it can restore activity but cannot create spaced-recall mastery retroactively.
 */
export async function importAttempts(requests: AttemptRequest[], deps: RecordDeps): Promise<ImportOutcome> {
  if (requests.length > MAX_IMPORT_ATTEMPTS) {
    throw new AttemptError("malformed_request", `an import can contain at most ${MAX_IMPORT_ATTEMPTS} answers`);
  }

  const unique = new Map<string, AttemptRequest>();
  for (const request of requests) {
    const previous = unique.get(request.eventId);
    if (previous && JSON.stringify(previous) !== JSON.stringify(request)) {
      throw new AttemptError("malformed_request", `event id "${request.eventId}" has conflicting answers`);
    }
    unique.set(request.eventId, request);
  }

  const now = new Date(deps.now).toISOString();
  const prepared: StoredEvent[] = [];
  const affected = new Set<string>();
  // Validate and evaluate every answer before the first write (all-or-nothing request).
  for (const req of unique.values()) {
    const { exercise } = resolve(deps.bundle, req);
    let result;
    try {
      result = evaluate(exercise, req.response);
    } catch (err) {
      if (err instanceof EvaluationError) throw new AttemptError("response_mismatch", err.message);
      throw err;
    }
    const signals = signalledConcepts(result);
    prepared.push({
      id: req.eventId,
      userId: deps.userId,
      kind: "attempt",
      occurredAt: now,
      contentId: req.unitId,
      localId: req.exerciseId,
      contentVersion: req.contentVersion,
      conceptIds: exercise.concepts,
      signals,
      skill: "knowledge",
      correct: result.correct,
      score: result.score,
      evaluatorVersion: EVALUATOR_VERSION,
    });
    exercise.concepts.forEach((id) => affected.add(id));
  }

  const imported = await deps.store.insertEvents(prepared);
  const events = await deps.store.eventsForConcepts([...affected]);
  const statuses = deriveConceptStates(graphFromBundle(deps.bundle), events, deps.now);
  const states: ConceptStateRow[] = [...statuses.values()]
    .filter((status) => affected.has(status.conceptId))
    .map((status) => ({
      conceptId: status.conceptId,
      state: status.state,
      because: status.because,
      evidence: status.evidence,
      engineVersion: ENGINE_VERSION,
    }));
  if (states.length) await deps.store.saveConceptStates(states);

  const reviewRows: ReviewRow[] = states.flatMap((state) => {
    const review = state.evidence.review;
    return review ? [{
      itemRef: state.conceptId,
      step: review.step,
      intervalDays: review.intervalDays,
      anchorAt: new Date(review.anchorAt).toISOString(),
      dueAt: new Date(review.dueAt).toISOString(),
    }] : [];
  });
  if (reviewRows.length) await deps.store.saveReviewItems(reviewRows);

  return { imported, duplicates: requests.length - imported, states };
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
