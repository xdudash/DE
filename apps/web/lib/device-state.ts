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
  unitId: string;
  exerciseId: string;
}

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
  return write(EVENTS_KEY, [...readAttempts(), event].slice(-MAX_STORED_ATTEMPTS));
}

/** Latest correctness per exercise id, for one unit. */
export function readLessonResults(unitId: string): Record<string, boolean> {
  const results: Record<string, boolean> = {};
  for (const a of readAttempts()) {
    if (a.unitId === unitId) results[a.exerciseId] = a.correct;
  }
  return results;
}
