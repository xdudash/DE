/**
 * Review scheduler v1: fixed expanding intervals, transparent and testable.
 * - Scheduling starts at the first correct graded result (attempt/recall/transfer).
 * - A successful recall that happens when due (or later) advances one step.
 * - A successful recall before the due date does not advance (no credit for cramming).
 * - A failed recall ("again") resets to step 0, anchored at the failure.
 * - Failed attempts outside review do not move the schedule (they affect state via accuracy).
 */
import type { LearningEvent, ReviewSchedule } from "./types.ts";

export const INTERVALS_DAYS = [1, 3, 7, 16, 35] as const;
export const DAY_MS = 86_400_000;

function schedule(step: number, anchorAt: number): ReviewSchedule {
  const s = Math.min(step, INTERVALS_DAYS.length - 1);
  const intervalDays = INTERVALS_DAYS[s]!;
  return { step: s, intervalDays, anchorAt, dueAt: anchorAt + intervalDays * DAY_MS };
}

/** Events must belong to one concept; order is normalised here. */
export function computeSchedule(events: LearningEvent[]): ReviewSchedule | null {
  const graded = events
    .filter((e) => e.kind === "attempt" || e.kind === "recall" || e.kind === "transfer")
    .filter((e) => typeof e.correct === "boolean")
    .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
  let current: ReviewSchedule | null = null;
  for (const e of graded) {
    if (!current) {
      if (e.correct) current = schedule(0, e.at);
      continue;
    }
    if (e.kind === "recall") {
      if (!e.correct) current = schedule(0, e.at);
      else if (e.at >= current.dueAt) current = schedule(current.step + 1, e.at);
      // early successful recall: keep schedule
    }
  }
  return current;
}
