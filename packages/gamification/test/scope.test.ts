import { test } from "node:test";
import assert from "node:assert/strict";
import { HEARTS, summarizeScoped } from "../src/progress.ts";

const T0 = Date.UTC(2026, 9, 22, 10, 0, 0);
const wrong = (i: number, practice?: boolean) => ({ at: T0 + i * 1000, correct: false, practice });

test("wrong answers while learning a lesson never cost hearts", () => {
  const s = summarizeScoped([wrong(0), wrong(1), wrong(2), wrong(3), wrong(4), wrong(5)], T0 + 10_000, "Europe/Berlin");
  assert.equal(s.hearts, HEARTS.max);
  assert.equal(s.nextHeartAt, null);
  // XP and the answer count still include them: effort while learning counts.
  assert.equal(s.answers, 6);
  assert.equal(s.xp, 12);
});

test("wrong answers in practice cost hearts as before", () => {
  const s = summarizeScoped([wrong(0, true), wrong(1, true), wrong(2), { at: T0 + 3000, correct: true, practice: true }], T0 + 10_000, "Europe/Berlin");
  assert.equal(s.hearts, HEARTS.max - 2);
  assert.notEqual(s.nextHeartAt, null);
});

test("answers stored before the change carry no mark and count as learning", () => {
  const s = summarizeScoped([{ at: T0, correct: false }], T0 + 1, "UTC");
  assert.equal(s.hearts, HEARTS.max);
});
