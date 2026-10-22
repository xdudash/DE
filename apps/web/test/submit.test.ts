import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { submitAttempt, type SubmitInput } from "../lib/attempts/submit.ts";

const input: SubmitInput = {
  eventId: "11111111-1111-4111-8111-111111111111",
  unitId: "unit.syntax.v2_declarative.a1",
  exerciseId: "x_order_vienna",
  contentVersion: "1.0.0",
  response: { type: "word_order", order: [2, 3, 0, 1] },
};

const stub = (init: ResponseInit | Error, capture?: { body?: unknown; url?: string }) =>
  (async (url: string | URL | globalThis.Request, options?: RequestInit) => {
    if (init instanceof Error) throw init;
    if (capture) {
      capture.url = String(url);
      capture.body = JSON.parse(String(options?.body));
    }
    return new Response("{}", init);
  }) as unknown as typeof fetch;

describe("submitAttempt", () => {
  it("posts the attempt without a verdict and with a server-checkable timestamp", async () => {
    const seen: { body?: Record<string, unknown>; url?: string } = {};
    const state = await submitAttempt(input, stub({ status: 201 }, seen));
    assert.deepEqual(state, { status: "saved" });
    assert.equal(seen.url, "/api/attempts");
    assert.equal(seen.body!.eventId, input.eventId);
    assert.equal("correct" in seen.body!, false);
    assert.equal("score" in seen.body!, false);
    assert.ok(!Number.isNaN(Date.parse(String(seen.body!.occurredAt))));
  });

  it("treats a replay (200) as saved", async () => {
    assert.deepEqual(await submitAttempt(input, stub({ status: 200 })), { status: "saved" });
  });

  it("treats 'not signed in' and 'not configured' as nothing to report", async () => {
    for (const status of [401, 503]) {
      assert.deepEqual(await submitAttempt(input, stub({ status })), { status: "off" });
    }
  });

  it("asks the learner to reload when the lesson version moved on", async () => {
    assert.deepEqual(await submitAttempt(input, stub({ status: 409 })), { status: "stale" });
  });

  it("reports a network failure and an unexpected status distinctly", async () => {
    assert.deepEqual(await submitAttempt(input, stub(new TypeError("offline"))), { status: "failed", reason: "network" });
    assert.deepEqual(await submitAttempt(input, stub({ status: 500 })), { status: "failed", reason: "http_500" });
  });
});

describe("submitAttempt with the answer's own time (DG-022)", () => {
  it("sends the original occurredAt on a retry instead of now", async () => {
    const seen: { body?: Record<string, unknown> } = {};
    await submitAttempt({ ...input, occurredAt: "2026-10-22T08:00:00.000Z" }, stub({ status: 201 }, seen));
    assert.equal(seen.body!.occurredAt, "2026-10-22T08:00:00.000Z");
  });
});
