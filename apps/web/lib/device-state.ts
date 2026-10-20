/**
 * What this browser remembers until accounts exist (DG-015 adds sign-in and server
 * storage). Nothing here is sent to the server, and the UI says so.
 *
 * Attempts are stored as append-only learning events (the same shape the learning
 * engine reads), so states and recommendations are computed from evidence, not
 * guessed from the page order.
 *
 * Storage can be blocked or full (private mode, site data cleared). Every access is
 * guarded: reads return empty values and writes return false instead of throwing, so
 * the page keeps working and can state the failure honestly.
 */
import type { LearningEvent } from "@deutschgo/learning-engine";

export type Goal = "life" | "work" | "study";
export const GOALS: readonly Goal[] = ["life", "work", "study"];
export const MINUTE_CHOICES: readonly number[] = [5, 10, 15, 20];

export interface Setup {
  goal: Goal;
  minutes: number;
}

/** A graded exercise answer, as the learning engine reads it, plus where it came from. */
export interface DeviceAttempt extends LearningEvent {
  kind: "attempt";
  /** Every attempt has a verdict; the engine's field is optional for other event kinds. */
  correct: boolean;
  unitId: string;
  exerciseId: string;
}

/** Fired on this window whenever the answers stored on this device change. */
export const PROGRESS_EVENT = "deutschgo:progress";
const SETUP_KEY = "deutschgo.setup.v1";
const EVENTS_KEY = "deutschgo.events.v1";
/** Bounds storage use on a device; the engine only needs recent evidence. */
export const MAX_STORED_ATTEMPTS = 2000;

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

function isAttempt(value: unknown): value is DeviceAttempt {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.kind === "attempt" &&
    typeof v.id === "string" &&
    typeof v.at === "number" &&
    typeof v.unitId === "string" &&
    typeof v.exerciseId === "string" &&
    typeof v.correct === "boolean" &&
    Array.isArray(v.conceptIds) &&
    v.conceptIds.every((c) => typeof c === "string")
  );
}

/** All stored attempts, oldest first. Corrupt entries are dropped, not trusted. */
export function readAttempts(): DeviceAttempt[] {
  const value = read<unknown>(EVENTS_KEY);
  return Array.isArray(value) ? value.filter(isAttempt) : [];
}

export interface AttemptInput {
  unitId: string;
  exerciseId: string;
  conceptIds: string[];
  correct: boolean;
}

export function recordAttempt(input: AttemptInput): boolean {
  const event: DeviceAttempt = {
    id: crypto.randomUUID(),
    kind: "attempt",
    at: Date.now(),
    contentId: input.exerciseId,
    conceptIds: input.conceptIds,
    skill: "knowledge",
    correct: input.correct,
    unitId: input.unitId,
    exerciseId: input.exerciseId,
  };
  const saved = write(EVENTS_KEY, [...readAttempts(), event].slice(-MAX_STORED_ATTEMPTS));
  if (saved) notifyProgress();
  return saved;
}

function notifyProgress(): void {
  try {
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  } catch {
    // No window (server or test): nothing to notify.
  }
}

/** Latest correctness per exercise id, for one unit. */
export function readLessonResults(unitId: string): Record<string, boolean> {
  const results: Record<string, boolean> = {};
  for (const a of readAttempts()) {
    if (a.unitId === unitId) results[a.exerciseId] = a.correct;
  }
  return results;
}

const LANGUAGE_KEY = "deutschgo.language.v1";

/**
 * The explanation language this browser last used, so the language gate can offer
 * to continue instead of asking again. `allowed` is passed in by the caller to keep
 * this module free of catalogue imports; an unknown or removed code is ignored.
 */
export function readLanguage(allowed: readonly string[]): string | null {
  const value = read<string>(LANGUAGE_KEY);
  return typeof value === "string" && allowed.includes(value) ? value : null;
}

export function writeLanguage(code: string): boolean {
  return write(LANGUAGE_KEY, code);
}

export interface AttemptStats {
  /** Graded answers given on this device. */
  answers: number;
  correct: number;
  /** Share of correct answers, or null before the first answer. */
  accuracy: number | null;
  /** Distinct exercises answered, so repeats do not inflate the count. */
  exercises: number;
  lessons: number;
  lastAt: number | null;
}

export function attemptStats(): AttemptStats {
  const attempts = readAttempts();
  const exercises = new Set<string>();
  const lessons = new Set<string>();
  let correct = 0;
  let lastAt: number | null = null;
  for (const a of attempts) {
    exercises.add(`${a.unitId}/${a.exerciseId}`);
    lessons.add(a.unitId);
    if (a.correct) correct += 1;
    if (lastAt === null || a.at > lastAt) lastAt = a.at;
  }
  return {
    answers: attempts.length,
    correct,
    accuracy: attempts.length === 0 ? null : correct / attempts.length,
    exercises: exercises.size,
    lessons: lessons.size,
    lastAt,
  };
}

/**
 * Removes everything DeutschGo keeps in this browser: the plan, the remembered
 * language and every recorded answer. Nothing was sent to a server, so this is the
 * whole of the learner's data. Returns false if storage refused, so the caller can
 * say the data is still there instead of claiming it is gone.
 */
export function clearDeviceData(): boolean {
  try {
    for (const key of [SETUP_KEY, EVENTS_KEY, LANGUAGE_KEY]) window.localStorage.removeItem(key);
    notifyProgress();
    return readAttempts().length === 0 && readSetup() === null;
  } catch {
    return false;
  }
}
