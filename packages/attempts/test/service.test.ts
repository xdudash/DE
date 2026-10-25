import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { DAY_MS } from "@deutschgo/learning-engine";
import { AttemptError } from "../src/errors.ts";
import { MemoryStore } from "../src/memory-store.ts";
import { MAX_CLIENT_LAG_MS, importAttempts, recordAttempt, recomputeAll } from "../src/service.ts";
import { T0, UNIT, UNIT_VERSION, V2, VERBS, bundle, iso, request } from "./fixtures.ts";

const USER = "11111111-1111-4111-8111-111111111111";
const deps = (store = new MemoryStore(), now = T0) => ({ bundle: bundle(), store, userId: USER, now });

const fails = async (req: unknown, code: string, status: number) => {
  await assert.rejects(() => recordAttempt(req as never, deps()), (e: unknown) => {
    assert.ok(e instanceof AttemptError, `expected AttemptError, got ${String(e)}`);
    assert.equal(e.code, code);
    assert.equal(e.status, status);
    return true;
  });
};

describe("recordAttempt", () => {
  it("evaluates on the server and stores the verdict with provenance", async () => {
    const d = deps();
    const out = await recordAttempt(request(), d);
    assert.equal(out.correct, true);
    assert.equal(out.recorded, true);
    assert.equal(out.feedback, "@ok");
    const stored = [...d.store.events.values()][0]!;
    assert.equal(stored.correct, true);
    assert.equal(stored.userId, USER);
    assert.equal(stored.contentId, UNIT);
    assert.equal(stored.localId, "x_order");
    assert.deepEqual(stored.conceptIds, [V2]);
    assert.equal(stored.evaluatorVersion, "1.1.0");
    assert.equal(stored.kind, "attempt");
  });

  it("marks a wrong answer wrong and keeps the signalled concept as evidence", async () => {
    const d = deps();
    const out = await recordAttempt(request({ response: { type: "word_order", order: [2, 0, 3, 1] } }), d);
    assert.equal(out.correct, false);
    assert.equal(out.ruleFeedback, "@fb.v3");
    assert.deepEqual([...d.store.events.values()][0]!.signals, [V2]);
  });

  it("collects gap-level signals from a cloze and reports per-gap results", async () => {
    const d = deps();
    const out = await recordAttempt(request({ exerciseId: "x_cloze", response: { type: "cloze", gaps: ["ich", "lerne"] } }), d);
    assert.equal(out.correct, false);
    assert.equal(out.score, 0);
    assert.deepEqual(out.gaps, [{ index: 0, correct: false }, { index: 1, correct: false }]);
    assert.deepEqual([...d.store.events.values()][0]!.signals, [VERBS]);
  });

  it("records partial credit without calling the attempt correct", async () => {
    const d = deps();
    const out = await recordAttempt(request({ exerciseId: "x_cloze", response: { type: "cloze", gaps: ["lerne", "du"] } }), d);
    assert.equal(out.correct, false);
    assert.equal(out.score, 0.5);
    assert.equal([...d.store.events.values()][0]!.score, 0.5);
  });

  it("is idempotent: replaying one event id stores a single event", async () => {
    const d = deps();
    const req = request();
    const first = await recordAttempt(req, d);
    const second = await recordAttempt(req, d);
    assert.equal(first.recorded, true);
    assert.equal(second.recorded, false);
    assert.equal(second.correct, true, "the learner still gets their result back");
    assert.equal(d.store.events.size, 1);
    assert.equal(d.store.insertCalls, 2);
  });

  it("derives and stores concept state plus the first review date", async () => {
    const d = deps();
    const out = await recordAttempt(request(), d);
    assert.deepEqual(out.states.map((s) => [s.conceptId, s.state]), [[V2, "in_progress"]]);
    assert.equal(out.states[0]!.engineVersion, "1.1.0");
    assert.equal(out.nextReviewAt, iso(T0 + DAY_MS));
    assert.equal(d.store.reviews.get(V2)!.intervalDays, 1);
  });

  it("moves a concept to needs_practice once the evidence says so, not before", async () => {
    const d = deps();
    const wrong = { type: "word_order" as const, order: [2, 0, 3, 1] };
    let out = await recordAttempt(request({ response: wrong }), d);
    assert.equal(out.states[0]!.state, "in_progress");
    await recordAttempt(request({ response: wrong }), d);
    out = await recordAttempt(request({ response: wrong }), d);
    assert.equal(out.states[0]!.state, "needs_practice");
    assert.equal(out.states[0]!.because, "low_recent_accuracy");
    assert.equal(d.store.states.get(V2)!.state, "needs_practice");
  });

  it("recomputes from stored evidence, so a replayed event cannot inflate progress", async () => {
    const d = deps();
    const req = request();
    await recordAttempt(req, d);
    const again = await recordAttempt(req, d);
    assert.equal(again.states[0]!.evidence.attempts, 1);
  });

  it("clamps a client clock that runs ahead of the server", async () => {
    const d = deps();
    await recordAttempt(request({ occurredAt: iso(T0 + 5 * DAY_MS) }), d);
    assert.equal([...d.store.events.values()][0]!.occurredAt, iso(T0));
  });

  it("keeps an earlier client time within the allowed lag (slow network, retry)", async () => {
    const d = deps(new MemoryStore(), T0 + MAX_CLIENT_LAG_MS);
    await recordAttempt(request({ occurredAt: iso(T0) }), d);
    assert.equal([...d.store.events.values()][0]!.occurredAt, iso(T0));
  });

  it("clamps backdating beyond the allowed lag, so reviews cannot be faked in one sitting (ADR-0016)", async () => {
    const store = new MemoryStore();
    const now = T0 + 10 * DAY_MS;
    const at = (ms: number) => recordAttempt(request({ occurredAt: iso(ms) }), deps(store, now));
    await at(now - 6 * DAY_MS);
    await at(now - 5 * DAY_MS);
    const last = await at(now);
    assert.equal([...store.events.values()][0]!.occurredAt, iso(now - MAX_CLIENT_LAG_MS));
    assert.notEqual(last.states[0]!.state, "provisionally_mastered");
    assert.equal(last.states[0]!.evidence.recalls, 0);
  });

  it("rejects unknown content, a version mismatch and a mismatched response", async () => {
    await fails(request({ unitId: "unit.syntax.nope.a1" }), "unknown_content", 404);
    await fails(request({ exerciseId: "x_missing" }), "unknown_content", 404);
    await fails(request({ contentVersion: "0.9.0" }), "version_mismatch", 409);
    await fails(request({ response: { type: "single_choice", optionId: "b" } }), "response_mismatch", 422);
    await fails(request({ response: { type: "word_order", order: [0, 1] } }), "response_mismatch", 422);
    await fails(request({ exerciseId: "x_choose", response: { type: "single_choice", optionId: "zzz" } }), "response_mismatch", 422);
  });

  it("writes nothing when the request is rejected", async () => {
    const store = new MemoryStore();
    await assert.rejects(() => recordAttempt(request({ contentVersion: "0.9.0" }), deps(store)));
    assert.equal(store.events.size, 0);
    assert.equal(store.states.size, 0);
  });
});

describe("importAttempts", () => {
  it("re-evaluates imported answers and dates them at import time", async () => {
    const d = deps();
    const first = request({ occurredAt: iso(T0 - 200 * DAY_MS) });
    const wrong = request({ response: { type: "word_order", order: [2, 0, 3, 1] }, occurredAt: iso(T0 - 100 * DAY_MS) });
    const result = await importAttempts([first, wrong], d);

    assert.equal(result.imported, 2);
    assert.equal(result.duplicates, 0);
    assert.deepEqual([...d.store.events.values()].map((e) => e.correct).sort(), [false, true]);
    assert.ok([...d.store.events.values()].every((e) => e.occurredAt === iso(T0)));
    assert.equal(result.states.find((s) => s.conceptId === V2)?.evidence.attempts, 2);
  });

  it("validates the whole batch before writing any event", async () => {
    const d = deps();
    await assert.rejects(() => importAttempts([
      request(),
      request({ contentVersion: "0.9.0" }),
    ], d), (e: unknown) => e instanceof AttemptError && e.code === "version_mismatch");
    assert.equal(d.store.events.size, 0);
    assert.equal(d.store.states.size, 0);
  });

  it("is idempotent across imports and duplicate ids in the same batch", async () => {
    const d = deps();
    const item = request();
    const first = await importAttempts([item, item], d);
    const replay = await importAttempts([item], d);
    assert.equal(first.imported, 1);
    assert.equal(first.duplicates, 1);
    assert.equal(replay.imported, 0);
    assert.equal(replay.duplicates, 1);
    assert.equal(d.store.events.size, 1);
  });
});

describe("recomputeAll", () => {
  it("rebuilds every derived row from the event log and omits untouched concepts", async () => {
    const d = deps();
    await recordAttempt(request(), d);
    d.store.states.clear();
    const rows = await recomputeAll(d);
    assert.deepEqual(rows.map((r) => r.conceptId), [V2]);
    assert.equal(d.store.states.get(V2)!.state, "in_progress");
  });

  it("reflects a later clock: yesterday's practice becomes a due review", async () => {
    const d = deps();
    await recordAttempt(request(), d);
    const rows = await recomputeAll({ ...d, now: T0 + 2 * DAY_MS });
    assert.equal(rows.find((r) => r.conceptId === V2)!.state, "review_due");
  });

  it("answers given when a review is due advance the schedule and reach mastery (ADR-0016)", async () => {
    const store = new MemoryStore();
    const at = (ms: number) => recordAttempt(request({ occurredAt: iso(ms) }), deps(store, ms));
    await at(T0);
    const first = await at(T0 + DAY_MS);
    assert.equal(first.nextReviewAt, iso(T0 + DAY_MS + 3 * DAY_MS));
    const second = await at(T0 + 4 * DAY_MS);
    assert.equal(second.states[0]!.state, "provisionally_mastered");
    assert.equal(second.states[0]!.evidence.successfulRecalls, 2);
    assert.equal(second.nextReviewAt, iso(T0 + 4 * DAY_MS + 7 * DAY_MS));
    assert.ok([...store.events.values()].every((e) => e.kind === "attempt"), "stored evidence is unchanged: still attempts");
  });
});
