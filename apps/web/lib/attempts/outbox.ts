/**
 * Answers waiting to reach the account (DG-022). Every submission is written here before
 * it is sent and removed once the server gives a final answer, so a closed tab, a lost
 * connection or a server error never silently drops evidence. The server is idempotent
 * on the event id, so sending an item twice stores it once.
 *
 * This is the write-ahead part of the offline queue. Batched upload, IndexedDB and the
 * rule for dating answers that waited on the device are DG-023; until then the server
 * dates a late answer at most 15 minutes before it arrives (ADR-0016).
 */
import type { SubmitInput, SubmitState } from "./submit.ts";

export interface PendingSubmission extends SubmitInput {
  /** When the learner answered (ISO 8601); sent as `occurredAt`. */
  occurredAt: string;
  tries: number;
  /** Epoch ms before which the item is not retried. */
  nextAt: number;
}

/** The part of Web Storage this module needs; tests pass a Map-backed fake. */
export interface KeyValue {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const OUTBOX_KEY = "deutschgo.outbox.v1";
/** Bounds storage use; the oldest items go first when it is exceeded. */
export const MAX_PENDING = 200;
/** After this many failed sends an item is given up and reported as not saved. */
export const MAX_TRIES = 8;
const BASE_DELAY_MS = 30_000;
const MAX_DELAY_MS = 60 * 60_000;

export function retryDelay(tries: number): number {
  return Math.min(BASE_DELAY_MS * 2 ** Math.max(0, tries - 1), MAX_DELAY_MS);
}

function isPending(v: unknown): v is PendingSubmission {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.eventId === "string" &&
    typeof o.unitId === "string" &&
    typeof o.exerciseId === "string" &&
    typeof o.contentVersion === "string" &&
    typeof o.occurredAt === "string" &&
    typeof o.tries === "number" &&
    typeof o.nextAt === "number" &&
    typeof o.response === "object" &&
    o.response !== null
  );
}

export function readOutbox(store: KeyValue): PendingSubmission[] {
  try {
    const raw = store.getItem(OUTBOX_KEY);
    const value: unknown = raw === null ? [] : JSON.parse(raw);
    return Array.isArray(value) ? value.filter(isPending) : [];
  } catch {
    return [];
  }
}

function writeOutbox(store: KeyValue, items: PendingSubmission[]): boolean {
  try {
    store.setItem(OUTBOX_KEY, JSON.stringify(items.slice(-MAX_PENDING)));
    return true;
  } catch {
    return false;
  }
}

/** Queues a submission before it is sent. False when storage refused it. */
export function enqueue(store: KeyValue, input: SubmitInput & { occurredAt: string }, now: number): boolean {
  const items = readOutbox(store).filter((i) => i.eventId !== input.eventId);
  return writeOutbox(store, [...items, { ...input, tries: 0, nextAt: now }]);
}

export type Settled = "saved" | "not_signed_in" | "stale" | "rejected" | "given_up";

/** What a send result means for the queued item. */
export function settle(state: SubmitState, tries: number): Settled | "retry" {
  switch (state.status) {
    case "saved":
      return "saved";
    case "off":
      // Nothing can store it now (no session or no database). The answer stays on this
      // device as evidence; importing it into an account later is DG-024.
      return "not_signed_in";
    case "stale":
      return "stale";
    case "failed":
      if (!isRetryable(state.reason)) return "rejected";
      return tries >= MAX_TRIES ? "given_up" : "retry";
    default:
      return "retry";
  }
}

/** Network errors, rate limits and server errors may pass; a refused request will not. */
export function isRetryable(reason: string): boolean {
  if (reason === "network" || reason === "unexpected") return true;
  const status = Number(/^http_(\d{3})$/.exec(reason)?.[1]);
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

export interface FlushResult {
  sent: number;
  settled: Partial<Record<Settled, number>>;
  waiting: number;
}

/**
 * Sends every due item once, oldest first, and stops at the first network failure (the
 * rest would fail the same way). Items that may pass later are rescheduled with backoff.
 */
export async function flushOutbox(
  store: KeyValue,
  send: (item: PendingSubmission) => Promise<SubmitState>,
  now: number,
): Promise<FlushResult> {
  const result: FlushResult = { sent: 0, settled: {}, waiting: 0 };
  for (const item of readOutbox(store)) {
    if (item.nextAt > now) continue;
    const state = await send(item);
    result.sent += 1;
    const tries = item.tries + 1;
    const outcome = settle(state, tries);
    const current = readOutbox(store);
    if (outcome === "retry") {
      writeOutbox(store, current.map((i) => (i.eventId === item.eventId ? { ...i, tries, nextAt: now + retryDelay(tries) } : i)));
      if (state.status === "failed" && state.reason === "network") break;
    } else {
      writeOutbox(store, current.filter((i) => i.eventId !== item.eventId));
      result.settled[outcome] = (result.settled[outcome] ?? 0) + 1;
    }
  }
  result.waiting = readOutbox(store).length;
  return result;
}

/** Sends one answer now, write-ahead: queued first, removed when settled. */
export async function sendWithOutbox(
  store: KeyValue,
  input: SubmitInput & { occurredAt: string },
  send: (item: PendingSubmission) => Promise<SubmitState>,
  now: number,
): Promise<{ state: SubmitState; queued: boolean }> {
  const queued = enqueue(store, input, now);
  const state = await send({ ...input, tries: 0, nextAt: now });
  const outcome = settle(state, 1);
  if (!queued) return { state, queued: false };
  const current = readOutbox(store);
  if (outcome === "retry") {
    writeOutbox(store, current.map((i) => (i.eventId === input.eventId ? { ...i, tries: 1, nextAt: now + retryDelay(1) } : i)));
    return { state, queued: true };
  }
  writeOutbox(store, current.filter((i) => i.eventId !== input.eventId));
  return { state, queued: false };
}
