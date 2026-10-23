import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  MAX_PENDING,
  MAX_TRIES,
  OUTBOX_KEY,
  enqueue,
  flushOutbox,
  isRetryable,
  readOutbox,
  retryDelay,
  sendWithOutbox,
  settle,
  type KeyValue,
  type PendingSubmission,
} from "../lib/attempts/outbox.ts";
import type { SubmitState } from "../lib/attempts/submit.ts";

const T0 = Date.UTC(2026, 9, 22, 8, 0, 0);

function memory(options: { failWrites?: boolean } = {}): KeyValue & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      if (options.failWrites) throw new Error("QuotaExceededError");
      data.set(k, v);
    },
  };
}

let n = 0;
const submission = (over: Partial<PendingSubmission> = {}) => ({
  eventId: `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`,
  unitId: "unit.syntax.v2_declarative.a1",
  exerciseId: "x_order",
  contentVersion: "1.0.0",
  response: { type: "word_order" as const, order: [1, 0] },
  occurredAt: new Date(T0).toISOString(),
  ...over,
});

/** A send function that answers from a script and records what it was asked. */
function sender(...answers: SubmitState[]) {
  const sent: PendingSubmission[] = [];
  const send = async (item: PendingSubmission) => {
    sent.push(item);
    return answers.length > 1 ? answers.shift()! : answers[0]!;
  };
  return { sent, send };
}

describe("settle: what a send result means", () => {
  it("removes saved, not-signed-in and stale answers; retries only what may pass later", () => {
    assert.equal(settle({ status: "saved" }, 1), "saved");
    assert.equal(settle({ status: "off" }, 1), "not_signed_in");
    assert.equal(settle({ status: "stale" }, 1), "stale");
    assert.equal(settle({ status: "failed", reason: "network" }, 1), "retry");
    assert.equal(settle({ status: "failed", reason: "http_500" }, 1), "retry");
    assert.equal(settle({ status: "failed", reason: "http_429" }, 1), "retry");
    assert.equal(settle({ status: "failed", reason: "http_400" }, 1), "rejected");
    assert.equal(settle({ status: "failed", reason: "http_422" }, 1), "rejected");
    assert.equal(settle({ status: "failed", reason: "network" }, MAX_TRIES), "given_up");
  });

  it("classifies retryable failures", () => {
    for (const r of ["network", "unexpected", "http_408", "http_429", "http_502"]) assert.equal(isRetryable(r), true, r);
    for (const r of ["http_400", "http_404", "http_422", "weird"]) assert.equal(isRetryable(r), false, r);
  });

  it("backs off exponentially up to an hour", () => {
    assert.equal(retryDelay(1), 30_000);
    assert.equal(retryDelay(2), 60_000);
    assert.equal(retryDelay(20), 3_600_000);
  });
});

describe("sendWithOutbox: write-ahead", () => {
  it("queues before sending and removes the item once saved", async () => {
    const store = memory();
    const input = submission();
    let queuedWhileSending = false;
    const send = async () => {
      queuedWhileSending = readOutbox(store).some((i) => i.eventId === input.eventId);
      return { status: "saved" } as SubmitState;
    };
    const out = await sendWithOutbox(store, input, send, T0);
    assert.equal(queuedWhileSending, true, "a closed tab during the request leaves the item queued");
    assert.deepEqual(out, { state: { status: "saved" }, queued: false });
    assert.deepEqual(readOutbox(store), []);
  });

  it("keeps a failed answer with its original id and time for a later retry", async () => {
    const store = memory();
    const input = submission();
    const out = await sendWithOutbox(store, input, sender({ status: "failed", reason: "network" }).send, T0);
    assert.equal(out.queued, true);
    const [item] = readOutbox(store);
    assert.equal(item!.eventId, input.eventId);
    assert.equal(item!.occurredAt, input.occurredAt);
    assert.equal(item!.tries, 1);
    assert.equal(item!.nextAt, T0 + retryDelay(1));
  });

  it("forgets answers no one can store (not signed in) and refused ones", async () => {
    const store = memory();
    await sendWithOutbox(store, submission(), sender({ status: "off" }).send, T0);
    await sendWithOutbox(store, submission(), sender({ status: "failed", reason: "http_422" }).send, T0);
    assert.deepEqual(readOutbox(store), []);
  });

  it("still sends when storage is blocked, and says the answer is not queued", async () => {
    const out = await sendWithOutbox(memory({ failWrites: true }), submission(), sender({ status: "failed", reason: "network" }).send, T0);
    assert.deepEqual(out, { state: { status: "failed", reason: "network" }, queued: false });
  });
});

describe("flushOutbox", () => {
  it("sends due items oldest first with their original id and time", async () => {
    const store = memory();
    const a = submission({ occurredAt: new Date(T0).toISOString() });
    const b = submission({ occurredAt: new Date(T0 + 1000).toISOString() });
    enqueue(store, a, T0);
    enqueue(store, b, T0);
    const s = sender({ status: "saved" });
    const out = await flushOutbox(store, s.send, T0);
    assert.deepEqual(s.sent.map((i) => [i.eventId, i.occurredAt]), [[a.eventId, a.occurredAt], [b.eventId, b.occurredAt]]);
    assert.deepEqual(out, { sent: 2, settled: { saved: 2 }, waiting: 0 });
  });

  it("waits until an item is due and stops at the first network failure", async () => {
    const store = memory();
    enqueue(store, submission(), T0);
    enqueue(store, submission(), T0);
    enqueue(store, submission(), T0 + 10_000);
    const offline = sender({ status: "failed", reason: "network" });
    const out = await flushOutbox(store, offline.send, T0);
    assert.equal(offline.sent.length, 1, "the rest would fail the same way");
    assert.equal(out.waiting, 3);
    const later = sender({ status: "saved" });
    await flushOutbox(store, later.send, T0 + 1);
    assert.equal(later.sent.length, 1, "the failed item waits for its backoff; the future one for its time");
  });

  it("gives an item up after MAX_TRIES failures", async () => {
    const store = memory();
    enqueue(store, submission(), T0);
    let now = T0;
    const s = sender({ status: "failed", reason: "http_500" });
    let last;
    for (let i = 0; i < MAX_TRIES; i++) {
      last = await flushOutbox(store, s.send, now);
      now += retryDelay(MAX_TRIES);
    }
    assert.deepEqual(last!.settled, { given_up: 1 });
    assert.deepEqual(readOutbox(store), []);
  });

  it("keeps one entry per event id and bounds its size", () => {
    const store = memory();
    const one = submission();
    enqueue(store, one, T0);
    enqueue(store, one, T0);
    assert.equal(readOutbox(store).length, 1);
    for (let i = 0; i < MAX_PENDING + 5; i++) enqueue(store, submission(), T0);
    assert.equal(readOutbox(store).length, MAX_PENDING);
  });

  it("drops corrupt entries instead of trusting them", () => {
    const store = memory();
    store.data.set(OUTBOX_KEY, JSON.stringify([{ eventId: 1 }, "x", { ...submission(), tries: 0, nextAt: T0 }]));
    assert.equal(readOutbox(store).length, 1);
    store.data.set(OUTBOX_KEY, "{not json");
    assert.deepEqual(readOutbox(store), []);
  });
});
