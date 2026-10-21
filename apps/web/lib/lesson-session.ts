/**
 * One run through a lesson (the guided flow): the order of steps, mistakes coming back
 * at the end, and the result shown on arrival. Pure and tested (test/lesson-session.test.ts).
 *
 * Rules:
 * - A wrongly answered exercise comes back once, at the end of the run. Retrieval after a
 *   delay is what makes a correction stick; repeating it immediately mostly tests memory
 *   of the answer just shown.
 * - XP follows the same rule as the motivation layer (ADR-0014): every answer counts,
 *   10 for a right one and 2 for a wrong one.
 * - Accuracy is first-try accuracy: a retry never improves it.
 */
import { XP } from "@deutschgo/gamification";

export interface SessionStep {
  id: string;
  kind: "learn" | "exercise";
  /** The exercise this step asks; equal for an exercise and its retry. */
  exerciseId?: string;
  retry?: boolean;
}

export interface SessionAnswer {
  exerciseId: string;
  correct: boolean;
  retry: boolean;
}

/** Appends a retry of the exercise at `index` when it was answered wrongly for the first time. */
export function requeueIfWrong<T extends SessionStep>(steps: readonly T[], index: number, correct: boolean): T[] {
  const step = steps[index];
  if (correct || !step || step.kind !== "exercise" || step.retry) return [...steps];
  const exerciseId = step.exerciseId ?? step.id;
  if (steps.some((s) => s.retry && (s.exerciseId ?? s.id) === exerciseId)) return [...steps];
  return [...steps, { ...step, id: `${step.id}~retry`, exerciseId, retry: true }];
}

export interface SessionResult {
  xp: number;
  /** Exercises answered right on the first try. */
  firstTry: number;
  /** Distinct exercises answered in this run. */
  exercises: number;
  /** firstTry / exercises, or null when nothing was answered. */
  accuracy: number | null;
}

export function sessionResult(answers: readonly SessionAnswer[]): SessionResult {
  const first = new Map<string, boolean>();
  let xp = 0;
  for (const a of answers) {
    xp += a.correct ? XP.correct : XP.wrong;
    if (!a.retry && !first.has(a.exerciseId)) first.set(a.exerciseId, a.correct);
  }
  const exercises = first.size;
  const firstTry = [...first.values()].filter(Boolean).length;
  return { xp, firstTry, exercises, accuracy: exercises === 0 ? null : firstTry / exercises };
}

/** Elapsed time as m:ss, for the arrival screen. */
export function clock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
