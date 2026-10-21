/** Learning engine v1 types. Spec: docs/domain/LEARNING_ENGINE.md */

export type EventKind = "exposure" | "attempt" | "recall" | "transfer" | "self_report";
export type Skill = "knowledge" | "reading" | "listening" | "writing" | "speaking";

/** Append-only evidence event (mirrors the learning_events table). */
export interface LearningEvent {
  id: string;
  kind: EventKind;
  /** Epoch milliseconds (server-received time is authoritative for scheduling). */
  at: number;
  contentId: string;
  localId?: string;
  conceptIds: string[];
  skill: Skill;
  /** For attempt/recall/transfer: evaluator result. */
  correct?: boolean;
  /** Concepts signalled by a matched error rule (only meaningful when correct === false). */
  signals?: string[];
}

export type ConceptState =
  | "unseen"
  | "available"
  | "in_progress"
  | "needs_practice"
  | "review_due"
  | "provisionally_mastered";

export interface EvidenceSummary {
  attempts: number;
  correct: number;
  /** Accuracy over the last RECENT_WINDOW graded results (attempt + recall + transfer); null if none. */
  recentAccuracy: number | null;
  recentGraded: number;
  /** Reviews: explicit recalls plus graded results given while the concept was due (ADR-0016). */
  recalls: number;
  successfulRecalls: number;
  transfers: number;
  /** Signalled errors pointing at this concept within SIGNAL_WINDOW_DAYS. */
  recentSignals: number;
  lastActivityAt: number | null;
  /** Review scheduling; null until the first correct graded result. */
  review: ReviewSchedule | null;
}

export interface ReviewSchedule {
  /** Index into INTERVALS_DAYS of the interval currently being waited. */
  step: number;
  intervalDays: number;
  anchorAt: number;
  dueAt: number;
}

export interface ConceptStatus {
  conceptId: string;
  state: ConceptState;
  /** Machine-readable explanation of why the state was assigned. */
  because: StateReason;
  evidence: EvidenceSummary;
}

export type StateReason =
  | "no_evidence"
  | "prerequisites_met"
  | "low_recent_accuracy"
  | "repeated_signalled_error"
  | "review_overdue"
  | "delayed_recall_confirmed"
  | "practising";

/** Minimal graph input: only prerequisites matter for v1. */
export interface GraphConcept {
  id: string;
  dependsOn: string[];
}

export interface RouteStep {
  /** Unit id or concept id the learner would open. */
  target: string;
  kind: "unit" | "concept";
  /** Concepts this step teaches (a concept step teaches itself). */
  concepts: string[];
  optional?: boolean;
}

export type ReasonCode = "requested" | "prerequisite_of" | "review_due" | "frequent_error" | "route_next";

export interface Recommendation {
  target: string;
  kind: "unit" | "concept";
  reason: ReasonCode;
  /** E.g. the concept a catch-up step is a prerequisite of. */
  reasonRef?: string;
}
