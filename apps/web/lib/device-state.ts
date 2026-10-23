/**
 * What this browser remembers: the plan, the language, and every answer as evidence.
 * Signed-in learners' answers are also sent to their account (lib/attempts/outbox.ts),
 * with the same event id as the record kept here; the screens still read this record
 * until the server read path exists (DG-024).
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
import { OUTBOX_KEY, type KeyValue } from "./attempts/outbox.ts";

import { normalizeSetup, type Setup } from "./plan.ts";
export { GOALS, MINUTE_CHOICES, REGIONS, normalizeSetup, type Goal, type Region, type Setup } from "./plan.ts";

/** A graded exercise answer, as the learning engine reads it, plus where it came from. */
export interface DeviceAttempt extends LearningEvent {
  kind: "attempt";
  /** Every attempt has a verdict; the engine's field is optional for other event kinds. */
  correct: boolean;
  unitId: string;
  exerciseId: string;
  /** Given in a practice run (a lesson already finished on this device): costs a heart if wrong. */
  practice?: boolean;
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
  return normalizeSetup(read<unknown>(SETUP_KEY));
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
    v.conceptIds.every((c) => typeof c === "string") &&
    (v.signals === undefined || (Array.isArray(v.signals) && v.signals.every((c) => typeof c === "string"))) &&
    (v.practice === undefined || typeof v.practice === "boolean")
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
  /** The answer's event id, shared with the server copy; generated when absent. */
  id?: string;
  /** Epoch ms of the answer; now when absent. */
  at?: number;
  /** Concepts signalled by matched error rules (wrong answers only). */
  signals?: string[];
  /** True in a practice run; only practice answers cost hearts (ADR-0014). */
  practice?: boolean;
}

export function recordAttempt(input: AttemptInput): boolean {
  const event: DeviceAttempt = {
    id: input.id ?? crypto.randomUUID(),
    kind: "attempt",
    at: input.at ?? Date.now(),
    contentId: input.exerciseId,
    conceptIds: input.conceptIds,
    skill: "knowledge",
    correct: input.correct,
    unitId: input.unitId,
    exerciseId: input.exerciseId,
  };
  if (!input.correct && input.signals?.length) event.signals = [...input.signals];
  if (input.practice) event.practice = true;
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
const SOUND_KEY = "deutschgo.sound.v1";

/** Sound effects in lessons: on unless the learner turned them off on this device. */
export function readSound(): boolean {
  return read<boolean>(SOUND_KEY) !== false;
}

export function writeSound(on: boolean): boolean {
  return write(SOUND_KEY, on);
}

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
 * This browser's storage for the outbox, or a store that refuses every write when storage
 * is blocked, so callers report "not queued" instead of throwing.
 */
export function deviceKeyValue(): KeyValue {
  try {
    const storage = window.localStorage;
    return storage;
  } catch {
    return {
      getItem: () => null,
      setItem: () => {
        throw new Error("storage unavailable");
      },
    };
  }
}

/**
 * Removes everything DeutschGo keeps in this browser: the plan, the remembered
 * language, every recorded answer and answers still waiting to be sent. An account's
 * copy is not touched: deleting it is the account's own action. Returns false if
 * storage refused, so the caller can say the data is still there instead of claiming
 * it is gone.
 */
export function clearDeviceData(): boolean {
  try {
    for (const key of [SETUP_KEY, EVENTS_KEY, LANGUAGE_KEY, SOUND_KEY, OUTBOX_KEY]) window.localStorage.removeItem(key);
    notifyProgress();
    return readAttempts().length === 0 && readSetup() === null;
  } catch {
    return false;
  }
}
