/**
 * What this browser remembers until accounts exist (DG-015 adds sign-in and server
 * storage). Nothing here is sent to the server, and the UI says so.
 *
 * Storage can be blocked or full (private mode, site data cleared). Every access is
 * guarded: reads return null and writes return false instead of throwing, so the
 * page keeps working and can state the failure honestly.
 */

export type Goal = "life" | "work" | "study";
export const GOALS: readonly Goal[] = ["life", "work", "study"];
export const MINUTE_CHOICES: readonly number[] = [5, 10, 15, 20];

export interface Setup {
  goal: Goal;
  minutes: number;
}

const SETUP_KEY = "deutschgo.setup.v1";
const lessonKey = (unitId: string) => `deutschgo.lesson.v1.${unitId}`;

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function readSetup(): Setup | null {
  const value = read<Setup>(SETUP_KEY);
  if (!value || !GOALS.includes(value.goal) || !MINUTE_CHOICES.includes(value.minutes)) return null;
  return value;
}

export function writeSetup(setup: Setup): boolean {
  return write(SETUP_KEY, setup);
}

/** Latest correctness per exercise id, for one unit. */
export function readLessonResults(unitId: string): Record<string, boolean> {
  const value = read<Record<string, boolean>>(lessonKey(unitId));
  return value && typeof value === "object" ? value : {};
}

export function recordExerciseResult(unitId: string, exerciseId: string, correct: boolean): boolean {
  const current = readLessonResults(unitId);
  return write(lessonKey(unitId), { ...current, [exerciseId]: correct });
}
