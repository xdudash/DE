import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { HEARTS, dayKey, heartsAt, levelFor, streakFor, summarize, xpFor, type Attempt } from "../src/progress.ts";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
/** A fixed Monday, 10:00 UTC. */
const MON = Date.UTC(2026, 9, 19, 10, 0);
const ok = (at: number): Attempt => ({ at, correct: true });
const bad = (at: number): Attempt => ({ at, correct: false });

describe("XP", () => {
  it("counts correct answers more than wrong ones, so effort still gives something", () => {
    assert.equal(xpFor([ok(0), ok(1), ok(2), bad(3), bad(4)]), 3 * 10 + 2 * 2);
    assert.equal(xpFor([]), 0);
  });
});

describe("levels", () => {
  it("starts level 2 at exactly 50 XP and level 3 at 200", () => {
    assert.equal(levelFor(0).level, 1);
    assert.equal(levelFor(49).level, 1);
    assert.equal(levelFor(50).level, 2);
    assert.equal(levelFor(199).level, 2);
    assert.equal(levelFor(200).level, 3);
  });

  it("reports progress into the level and XP still needed", () => {
    assert.deepEqual(levelFor(0), { level: 1, intoLevel: 0, toNext: 50 });
    assert.deepEqual(levelFor(60), { level: 2, intoLevel: 10, toNext: 140 });
  });

  it("treats negative or fractional XP as zero or whole points", () => {
    assert.equal(levelFor(-5).level, 1);
    assert.equal(levelFor(50.9).level, 2);
  });
});

describe("streaks", () => {
  const at = (day: number) => Date.UTC(2026, 9, 19 + day, 12, 0);

  it("is zero with no activity", () => {
    assert.deepEqual(streakFor([], MON, "UTC"), { current: 0, longest: 0 });
  });

  it("counts consecutive days ending today", () => {
    const attempts = [ok(at(0)), ok(at(1)), ok(at(2))];
    assert.deepEqual(streakFor(attempts, at(2), "UTC"), { current: 3, longest: 3 });
  });

  it("keeps the streak through a day that has not had an answer yet", () => {
    const attempts = [ok(at(0)), ok(at(1))];
    assert.equal(streakFor(attempts, at(2), "UTC").current, 2);
  });

  it("is broken after a full day without an answer, but the longest run is kept", () => {
    const attempts = [ok(at(0)), ok(at(1)), ok(at(2)), ok(at(5))];
    assert.deepEqual(streakFor(attempts, at(6), "UTC"), { current: 1, longest: 3 });
    assert.equal(streakFor(attempts, at(7), "UTC").current, 0);
  });

  it("counts the learner's own calendar day, not UTC", () => {
    // 23:30 UTC on Monday is already Tuesday in Budapest (UTC+2), and so is 00:30 UTC on Tuesday.
    const attempts = [ok(Date.UTC(2026, 9, 19, 23, 30)), ok(Date.UTC(2026, 9, 20, 0, 30))];
    assert.equal(dayKey(attempts[0]!.at, "Europe/Budapest"), "2026-10-20");
    assert.equal(streakFor(attempts, attempts[1]!.at, "Europe/Budapest").current, 1);
    assert.equal(streakFor(attempts, attempts[1]!.at, "UTC").current, 2);
  });
});

describe("hearts", () => {
  it("starts full and stays full with correct answers", () => {
    assert.deepEqual(heartsAt([ok(MON), ok(MON + 1)], MON + 2), { hearts: HEARTS.max, nextHeartAt: null });
  });

  it("loses one heart per wrong answer and says when the next one comes back", () => {
    const r = heartsAt([bad(MON), bad(MON + MIN)], MON + 2 * MIN);
    assert.equal(r.hearts, 3);
    assert.equal(r.nextHeartAt, MON + HEARTS.regenMs);
  });

  it("gives a heart back after the regeneration interval, and does not lose time reloading", () => {
    const attempts = [bad(MON), bad(MON + MIN)];
    assert.equal(heartsAt(attempts, MON + HEARTS.regenMs - 1).hearts, 3);
    assert.equal(heartsAt(attempts, MON + HEARTS.regenMs).hearts, 4);
    assert.equal(heartsAt(attempts, MON + 2 * HEARTS.regenMs).hearts, 5);
  });

  it("never goes below zero and recovers one at a time", () => {
    const attempts = Array.from({ length: 7 }, (_, i) => bad(MON + i * MIN));
    assert.equal(heartsAt(attempts, MON + 7 * MIN).hearts, 0);
    assert.equal(heartsAt(attempts, MON + 7 * MIN + HEARTS.regenMs).hearts, 1);
  });

  it("is order-independent: it sorts the evidence before counting", () => {
    const sorted = [bad(MON), bad(MON + MIN)];
    const shuffled = [bad(MON + MIN), bad(MON)];
    assert.deepEqual(heartsAt(shuffled, MON + 3 * MIN), heartsAt(sorted, MON + 3 * MIN));
  });
});

describe("summary", () => {
  it("combines the parts for one learner", () => {
    const s = summarize([ok(MON), bad(MON + MIN), ok(MON + DAY)], MON + DAY, "UTC");
    assert.equal(s.answers, 3);
    assert.equal(s.xp, 10 + 2 + 10);
    assert.equal(s.streak, 2);
    // One day later the lost heart has long come back.
    assert.equal(s.hearts, 5);
    assert.equal(summarize([ok(MON), bad(MON + MIN)], MON + MIN, "UTC").hearts, 4);
  });
});
