import { test } from "node:test";
import assert from "node:assert/strict";
import { clock, requeueIfWrong, sessionResult, type SessionStep } from "../lib/lesson-session.ts";

const steps: SessionStep[] = [
  { id: "intro", kind: "learn" },
  { id: "x1", kind: "exercise", exerciseId: "x1" },
  { id: "x2", kind: "exercise", exerciseId: "x2" },
];

test("a wrong answer brings the exercise back once, at the end", () => {
  const after = requeueIfWrong(steps, 1, false);
  assert.equal(after.length, 4);
  assert.deepEqual(after[3], { id: "x1~retry", kind: "exercise", exerciseId: "x1", retry: true });
  // Wrong again on the retry: it does not come back a second time.
  assert.equal(requeueIfWrong(after, 3, false).length, 4);
  // Wrong on the original again (not possible in the flow, but the rule holds): still once.
  assert.equal(requeueIfWrong(after, 1, false).length, 4);
});

test("right answers and reading steps never add steps", () => {
  assert.equal(requeueIfWrong(steps, 1, true).length, 3);
  assert.equal(requeueIfWrong(steps, 0, false).length, 3);
  assert.equal(requeueIfWrong(steps, 9, false).length, 3);
});

test("the result uses first-try accuracy and the ADR-0014 XP rule", () => {
  const result = sessionResult([
    { exerciseId: "x1", correct: false, retry: false },
    { exerciseId: "x2", correct: true, retry: false },
    { exerciseId: "x1", correct: true, retry: true },
  ]);
  assert.equal(result.xp, 2 + 10 + 10);
  assert.equal(result.exercises, 2);
  assert.equal(result.firstTry, 1);
  assert.equal(result.accuracy, 0.5);
});

test("an empty run has no accuracy rather than 0%", () => {
  assert.deepEqual(sessionResult([]), { xp: 0, firstTry: 0, exercises: 0, accuracy: null });
});

test("the clock shows minutes and zero-padded seconds", () => {
  assert.equal(clock(0), "0:00");
  assert.equal(clock(65_400), "1:05");
  assert.equal(clock(-5), "0:00");
  assert.equal(clock(10 * 60_000), "10:00");
});
