/**
 * Attempt recording: the request, the stored outcome, and the storage port.
 * Spec: docs/architecture/ARCHITECTURE.md (data flow 2), docs/architecture/DATA_AND_PRIVACY.md.
 *
 * The core never talks to a database. A caller passes a `Store`; the web app
 * implements it on PostgreSQL (apps/web/lib/data), tests use the in-memory one.
 */
import type { Response } from "@deutschgo/content-kit/evaluate";
import type { ConceptStatus, LearningEvent } from "@deutschgo/learning-engine";

/** What a client sends. `correct` is deliberately absent: the server decides. */
export interface AttemptRequest {
  /** Client-generated UUID; replaying the same id must not create a second event. */
  eventId: string;
  unitId: string;
  exerciseId: string;
  /** Version of the unit the client rendered. A mismatch is rejected, not guessed. */
  contentVersion: string;
  response: Response;
  /** Client clock, ISO 8601. Clamped to the server clock when it runs ahead. */
  occurredAt: string;
}

export interface StoredEvent {
  id: string;
  userId: string;
  kind: "attempt";
  occurredAt: string;
  contentId: string;
  localId: string;
  contentVersion: string;
  conceptIds: string[];
  signals: string[];
  skill: "knowledge";
  correct: boolean;
  score: number;
  evaluatorVersion: string;
}

export interface ReviewRow {
  itemRef: string;
  step: number;
  intervalDays: number;
  anchorAt: string;
  dueAt: string;
}

export interface ConceptStateRow {
  conceptId: string;
  state: ConceptStatus["state"];
  because: string;
  evidence: unknown;
  engineVersion: string;
}

/**
 * Storage port. Every method acts on behalf of one learner; the implementation is
 * responsible for enforcing that (row-level security, not a WHERE clause we hope for).
 */
export interface Store {
  /** Inserts the event, or reports that this id already exists (idempotent replay). */
  insertEvent(event: StoredEvent): Promise<{ inserted: boolean }>;
  /** Every event of this learner that mentions any of `conceptIds`. */
  eventsForConcepts(conceptIds: string[]): Promise<LearningEvent[]>;
  /** Replaces the derived rows for exactly these concepts. */
  saveConceptStates(rows: ConceptStateRow[]): Promise<void>;
  saveReviewItems(rows: ReviewRow[]): Promise<void>;
}

export interface AttemptOutcome {
  /** False when the event id had already been stored; the rest is still returned. */
  recorded: boolean;
  correct: boolean;
  score: number;
  /** Feedback keys to render; the client resolves them in the explanation language. */
  feedback: string;
  ruleFeedback?: string;
  explanation: string;
  gaps?: { index: number; correct: boolean }[];
  /** Updated state of every concept the exercise touches. */
  states: ConceptStateRow[];
  nextReviewAt?: string;
}
