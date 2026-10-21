/**
 * Review scheduler v1: fixed expanding intervals, transparent and testable (ADR-0016).
 * - Scheduling starts at the first correct graded result (attempt/recall/transfer).
 * - A review is any graded result given once the concept is due, plus every explicit
 *   `recall` event. Which screen produced the answer does not matter, and the client
 *   cannot declare it: the evidence and its timestamps decide.
 * - A successful review given when due (or later) advances one step.
 * - A successful explicit recall before the due date does not advance (no credit for cramming).
 * - A failed review ("again") resets to step 0, anchored at the failure.
 * - Results before the due date that are not explicit recalls do not move the schedule
 *   (they affect state via accuracy).
 */
import type { LearningEvent, ReviewSchedule } from "./types.ts";

export const INTERVALS_DAYS = [1, 3, 7, 16, 35] as const;
export const DAY_MS = 86_400_000;

/** One retrieval of a concept after a delay, as counted for the schedule and for mastery. */
export interface ReviewOutcome {
  eventId: string;
  at: number;
  correct: boolean;
  /** `recall`: an explicit review event; `due`: another graded result given while due. */
  source: "recall" | "due";
}

export interface ReviewHistory {
  schedule: ReviewSchedule | null;
  reviews: ReviewOutcome[];
}

function schedule(step: number, anchorAt: number): ReviewSchedule {
  const s = Math.min(step, INTERVALS_DAYS.length - 1);
  const intervalDays = INTERVALS_DAYS[s]!;
  return { step: s, intervalDays, anchorAt, dueAt: anchorAt + intervalDays * DAY_MS };
}

const isGraded = (e: LearningEvent): e is LearningEvent & { correct: boolean } =>
  (e.kind === "attempt" || e.kind === "recall" || e.kind === "transfer") && typeof e.correct === "boolean";

/** Events must belong to one concept; order is normalised here. */
export function reviewHistory(events: LearningEvent[]): ReviewHistory {
  const graded = events.filter(isGraded).sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
  let current: ReviewSchedule | null = null;
  const reviews: ReviewOutcome[] = [];
  for (const e of graded) {
    if (!current) {
      if (e.correct) current = schedule(0, e.at);
      continue;
    }
    const due = e.at >= current.dueAt;
    if (e.kind !== "recall" && !due) continue;
    reviews.push({ eventId: e.id, at: e.at, correct: e.correct, source: e.kind === "recall" ? "recall" : "due" });
    if (!e.correct) current = schedule(0, e.at);
    else if (due) current = schedule(current.step + 1, e.at);
    // early successful recall: keep schedule
  }
  return { schedule: current, reviews };
}

export function computeSchedule(events: LearningEvent[]): ReviewSchedule | null {
  return reviewHistory(events).schedule;
}
