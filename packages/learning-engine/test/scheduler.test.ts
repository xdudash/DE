import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { DAY_MS, INTERVALS_DAYS, computeSchedule } from "../src/scheduler.ts";
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
});
