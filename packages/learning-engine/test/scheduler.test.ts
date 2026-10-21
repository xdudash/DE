import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { DAY_MS, INTERVALS_DAYS, computeSchedule, reviewHistory } from "../src/scheduler.ts";
import { day, ev } from "./helpers.ts";

const C = "concept.syntax.v2";

describe("review scheduler v1", () => {
  it("has no schedule until the first correct result", () => {
    assert.equal(computeSchedule([]), null);
    assert.equal(computeSchedule([ev("attempt", day(0), C, false), ev("exposure", day(0), C)]), null);
  });
  it("starts at 1 day after the first correct attempt", () => {
    const s = computeSchedule([ev("attempt", day(0), C, false), ev("attempt", day(0) + 60_000, C, true)])!;
    assert.equal(s.step, 0);
    assert.equal(s.dueAt, day(0) + 60_000 + DAY_MS);
  });
  it("advances one step per on-time successful recall, capped at the last interval", () => {
    let at = day(0);
    const events = [ev("attempt", at, C, true)];
    for (const d of INTERVALS_DAYS) { at += d * DAY_MS; events.push(ev("recall", at, C, true)); }
    at += 35 * DAY_MS; events.push(ev("recall", at, C, true));
    const s = computeSchedule(events)!;
    assert.equal(s.step, INTERVALS_DAYS.length - 1);
    assert.equal(s.intervalDays, 35);
  });
  it("gives no credit for early recalls", () => {
    const s = computeSchedule([ev("attempt", day(0), C, true), ev("recall", day(0) + 3_600_000, C, true)])!;
    assert.equal(s.step, 0);
    assert.equal(s.anchorAt, day(0));
  });
  it("resets to step 0 on a failed recall ('again')", () => {
    const s = computeSchedule([ev("attempt", day(0), C, true), ev("recall", day(1), C, true), ev("recall", day(5), C, false)])!;
    assert.equal(s.step, 0);
    assert.equal(s.dueAt, day(6));
  });
  it("ignores failed ordinary attempts and input order", () => {
    const a = [ev("attempt", day(0), C, true), ev("recall", day(1), C, true), ev("attempt", day(2), C, false)];
    assert.deepEqual(computeSchedule(a), computeSchedule([...a].reverse()));
    assert.equal(computeSchedule(a)!.step, 1);
  });

  describe("answers given while due count as reviews (ADR-0016)", () => {
    it("an ordinary correct attempt on or after the due date advances like a recall", () => {
      const s = computeSchedule([ev("attempt", day(0), C, true), ev("attempt", day(1), C, true), ev("attempt", day(4), C, true)])!;
      assert.equal(s.step, 2);
      assert.equal(s.dueAt, day(4) + 7 * DAY_MS);
    });
    it("a wrong attempt while due resets to 1 day from the failure", () => {
      const s = computeSchedule([ev("attempt", day(0), C, true), ev("attempt", day(1), C, true), ev("attempt", day(4) + 5, C, false)])!;
      assert.equal(s.step, 0);
      assert.equal(s.dueAt, day(5) + 5);
    });
    it("only the first answer of a session counts; later ones are before the new due date", () => {
      const session = [0, 1, 2, 3].map((i) => ev("attempt", day(1) + i * 60_000, C, true));
      const h = reviewHistory([ev("attempt", day(0), C, true), ...session]);
      assert.equal(h.reviews.length, 1);
      assert.equal(h.schedule!.step, 1);
    });
    it("a failed first answer of a session is 'again'; the rest of the session earns no credit", () => {
      const session = [ev("attempt", day(1), C, false), ev("attempt", day(1) + 60_000, C, true)];
      const h = reviewHistory([ev("attempt", day(0), C, true), ...session]);
      assert.deepEqual(h.reviews.map((r) => r.correct), [false]);
      assert.equal(h.schedule!.step, 0);
      assert.equal(h.schedule!.anchorAt, day(1));
    });
    it("attempts before the due date are not reviews", () => {
      const h = reviewHistory([ev("attempt", day(0), C, true), ev("attempt", day(1) - 1, C, false), ev("attempt", day(1) - 1, C, true)]);
      assert.equal(h.reviews.length, 0);
      assert.equal(h.schedule!.step, 0);
    });
    it("takes results with the same timestamp wrong-first, so a tie earns no credit", () => {
      const tie = [ev("attempt", day(1), C, true, { id: "a" }), ev("attempt", day(1), C, false, { id: "z" })];
      const h = reviewHistory([ev("attempt", day(0), C, true), ...tie]);
      assert.deepEqual(h.reviews.map((r) => r.correct), [false]);
      assert.equal(h.schedule!.step, 0);
    });
    it("a recall or transfer before the due date does not open the review early", () => {
      const h = reviewHistory([ev("attempt", day(0), C, true), ev("transfer", day(0) + 1000, C, true), ev("recall", day(0) + 2000, C, true), ev("attempt", day(1), C, true)]);
      assert.equal(h.reviews.length, 1);
      assert.equal(h.schedule!.step, 1);
      assert.equal(h.schedule!.anchorAt, day(1));
    });
    it("records where each review came from and does not depend on input order", () => {
      const events = [ev("attempt", day(0), C, true), ev("recall", day(1), C, true), ev("transfer", day(4), C, true), ev("recall", day(5), C, false)];
      const h = reviewHistory(events);
      assert.deepEqual(h.reviews.map((r) => r.source), ["recall", "due", "recall"]);
      assert.deepEqual(reviewHistory([...events].reverse()), h);
    });
  });
});
