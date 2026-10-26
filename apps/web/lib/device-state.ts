/**
 * What this browser remembers: the plan, the language, and every answer as evidence.
 * Signed-in learners' answers are also sent to their account (lib/attempts/outbox.ts),
 * with the same event id as the record kept here. The shared progress provider merges
 * device and account evidence by that id (lib/progress/client.tsx).
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
import type { Response } from "@deutschgo/content-kit/evaluate";
import type { SessionAnswer } from "./lesson-session.ts";
import { OUTBOX_KEY, type KeyValue } from "./attempts/outbox.ts";

import { normalizeSetup, type Setup } from "./plan.ts";
export { GOALS, MINUTE_CHOICES, normalizeSetup, type Goal, type Setup } from "./plan.ts";

/** A graded exercise answer, as the learning engine reads it, plus where it came from. */
export interface DeviceAttempt extends LearningEvent {
  kind: "attempt";
  /** Every attempt has a verdict; the engine's field is optional for other event kinds. */
  correct: boolean;
  unitId: string;
  exerciseId: string;
  /** Given in a practice run (a lesson already finished on this device): costs a heart if wrong. */
  practice?: boolean;
  /** The raw response and content version permit an explicit, server-verified account import. */
  response?: Response;
  contentVersion?: string;
}

/** Fired on this window whenever the answers stored on this device change. */
export const PROGRESS_EVENT = "deutschgo:progress";
/** Fired after the server confirms an answer, so the shared account view refreshes. */
export const ACCOUNT_PROGRESS_EVENT = "deutschgo:account-progress";
const SETUP_KEY = "deutschgo.setup.v1";
const PLACEMENT_KEY = "deutschgo.placement.v1";
const LESSON_CHECKPOINT_KEY = "deutschgo.lesson-checkpoint.v1";
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

export interface PlacementEstimate {
  correct: number;
  total: number;
  band: "A0" | "A0-A1" | "A1";
  completedAt: number;
}

export function readPlacement(): PlacementEstimate | null {
  const value = read<unknown>(PLACEMENT_KEY);
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (!Number.isInteger(record.correct) || !Number.isInteger(record.total) || !Number.isFinite(record.completedAt)) return null;
  if (Number(record.total) < 1 || Number(record.correct) < 0 || Number(record.correct) > Number(record.total)) return null;
  if (record.band !== "A0" && record.band !== "A0-A1" && record.band !== "A1") return null;
  return { correct: Number(record.correct), total: Number(record.total), band: record.band, completedAt: Number(record.completedAt) };
}

export function writePlacement(estimate: PlacementEstimate): boolean {
  return write(PLACEMENT_KEY, estimate);
}

/** The uncompleted part of a lesson, stored on this device for a later visit. */
export interface LessonCheckpoint {
  unitId: string;
  contentVersion: string;
  href: string;
  title: string;
  remainingStepIds: string[];
  answers: SessionAnswer[];
  completedSteps: number;
  totalSteps: number;
  elapsedMs: number;
  practice: boolean;
  updatedAt: number;
}

export const LESSON_CHECKPOINT_EVENT = "deutschgo:lesson-checkpoint";

export function readLessonCheckpoint(unitId?: string, contentVersion?: string): LessonCheckpoint | null {
  const value = read<unknown>(LESSON_CHECKPOINT_KEY);
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.unitId !== "string" || typeof v.contentVersion !== "string" || typeof v.href !== "string" || typeof v.title !== "string" ||
      !Array.isArray(v.remainingStepIds) || !v.remainingStepIds.every((id) => typeof id === "string") || v.remainingStepIds.length === 0 ||
      !Array.isArray(v.answers) || !v.answers.every((a) => a && typeof a === "object" && typeof a.exerciseId === "string" && typeof a.correct === "boolean" && typeof a.retry === "boolean") ||
      !Number.isInteger(v.completedSteps) || !Number.isInteger(v.totalSteps) || Number(v.completedSteps) < 0 || Number(v.totalSteps) < Number(v.completedSteps) ||
      !Number.isFinite(v.elapsedMs) || Number(v.elapsedMs) < 0 || !Number.isFinite(v.updatedAt) || typeof v.practice !== "boolean") return null;
  if ((unitId && v.unitId !== unitId) || (contentVersion && v.contentVersion !== contentVersion)) return null;
  return v as unknown as LessonCheckpoint;
}

export function writeLessonCheckpoint(checkpoint: LessonCheckpoint | null): boolean {
  try {
    if (checkpoint) window.localStorage.setItem(LESSON_CHECKPOINT_KEY, JSON.stringify(checkpoint));
    else window.localStorage.removeItem(LESSON_CHECKPOINT_KEY);
    window.dispatchEvent(new Event(LESSON_CHECKPOINT_EVENT));
    return true;
  } catch {
    return false;
  }
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
  response?: Response;
  contentVersion?: string;
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
  if (input.response) event.response = input.response;
  if (input.contentVersion) event.contentVersion = input.contentVersion;
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

export interface DeviceDataExport {
  schema: "deutschgo.device-export/1";
  exportedAt: string;
  data: Record<string, unknown>;
}

const DEVICE_DATA_KEYS = new Set([SETUP_KEY, PLACEMENT_KEY, LESSON_CHECKPOINT_KEY, EVENTS_KEY, LANGUAGE_KEY, SOUND_KEY, OUTBOX_KEY, "deutschgo.vocabulary.v1", "deutschgo.route-plan.v1"]);

function isDeviceDataKey(key: string): boolean {
  return DEVICE_DATA_KEYS.has(key) || /^deutschgo-writing-(?:v1|active-v1):(en|uk|ru|ar)$/.test(key);
}

/** A portable snapshot of the data this browser stores for DeutschGo. */
export function exportDeviceData(): DeviceDataExport {
  const data: Record<string, unknown> = {};
  const storage = window.localStorage;
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key || !isDeviceDataKey(key)) continue;
    const value = storage.getItem(key);
    if (value === null) continue;
    try { data[key] = JSON.parse(value) as unknown; }
    catch { data[key] = value; }
  }
  return { schema: "deutschgo.device-export/1", exportedAt: new Date().toISOString(), data };
}

/** Reject malformed or unrelated JSON before it is offered as a device restore. */
export function validateDeviceDataExport(value: unknown): DeviceDataExport | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const snapshot = value as Record<string, unknown>;
  if (snapshot.schema !== "deutschgo.device-export/1" || typeof snapshot.exportedAt !== "string" || !Number.isFinite(Date.parse(snapshot.exportedAt))) return null;
  if (!snapshot.data || typeof snapshot.data !== "object" || Array.isArray(snapshot.data)) return null;
  const data = snapshot.data as Record<string, unknown>;
  const entries = Object.entries(data);
  if (entries.length > 64 || entries.some(([key, item]) => !isDeviceDataKey(key) || JSON.stringify(item) === undefined)) return null;
  return { schema: "deutschgo.device-export/1", exportedAt: snapshot.exportedAt, data };
}

/** Restore a validated backup atomically as far as localStorage permits. */
export function restoreDeviceData(snapshot: DeviceDataExport): boolean {
  try {
    const storage = window.localStorage;
    const before = new Map<string, string>();
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && isDeviceDataKey(key)) {
        const value = storage.getItem(key);
        if (value !== null) before.set(key, value);
      }
    }
    const writeSnapshot = (entries: Iterable<[string, string]>) => {
      for (let i = storage.length - 1; i >= 0; i--) {
        const key = storage.key(i);
        if (key && isDeviceDataKey(key)) storage.removeItem(key);
      }
      for (const [key, value] of entries) storage.setItem(key, value);
    };
    const restored = Object.entries(snapshot.data).map(([key, value]) => [
      key,
      key.startsWith("deutschgo-writing-active-v1:") && typeof value === "string" ? value : JSON.stringify(value),
    ] as [string, string]);
    try {
      writeSnapshot(restored);
      for (const [key, raw] of restored) if (storage.getItem(key) !== raw) throw new Error("restore_verification_failed");
    } catch (error) {
      writeSnapshot(before.entries());
      throw error;
    }
    notifyProgress();
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes everything DeutschGo keeps in this browser: the plan, remembered language,
 * answers, queued sends, saved vocabulary and route preferences. An account's copy is not touched:
 * deleting it is the account's own action. Returns false if
 * storage refused, so the caller can say the data is still there instead of claiming
 * it is gone.
 */
export function clearDeviceData(): boolean {
  try {
    for (const key of [SETUP_KEY, PLACEMENT_KEY, LESSON_CHECKPOINT_KEY, EVENTS_KEY, LANGUAGE_KEY, SOUND_KEY, OUTBOX_KEY, "deutschgo.vocabulary.v1", "deutschgo.route-plan.v1"]) window.localStorage.removeItem(key);
    const writingKeys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && (key.startsWith("deutschgo-writing-v1:") || key.startsWith("deutschgo-writing-active-v1:"))) writingKeys.push(key);
    }
    for (const key of writingKeys) window.localStorage.removeItem(key);
    notifyProgress();
    return readAttempts().length === 0 && readSetup() === null;
  } catch {
    return false;
  }
}
