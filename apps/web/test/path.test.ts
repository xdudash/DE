import { test } from "node:test";
import assert from "node:assert/strict";
import { lineProgress, pickLine, stationStates, type StationInput } from "../lib/path.ts";

const lesson = (unitId: string, exerciseIds: string[]): StationInput => ({ kind: "lesson", unitId, exerciseIds });
const planned: StationInput = { kind: "planned", exerciseIds: [] };

test("a new learner is at the first lesson; planned topics are never offered", () => {
  const states = stationStates([planned, lesson("u1", ["a", "b"]), planned, lesson("u2", ["c"])], {});
  assert.deepEqual(states, ["planned", "current", "planned", "open"]);
});

test("a lesson is done only when every exercise has been answered", () => {
  const partial = stationStates([lesson("u1", ["a", "b"])], { u1: new Set(["a"]) });
  assert.deepEqual(partial, ["current"]);
  const full = stationStates([lesson("u1", ["a", "b"]), lesson("u2", ["c"])], { u1: new Set(["a", "b"]) });
  assert.deepEqual(full, ["done", "current"]);
});

test("there is at most one current station, even if a later lesson was finished first", () => {
  const states = stationStates([lesson("u1", ["a"]), lesson("u2", ["b"]), lesson("u3", ["c"])], { u2: new Set(["b"]) });
  assert.deepEqual(states, ["current", "done", "open"]);
});

test("a lesson without exercises is never counted as done", () => {
  assert.deepEqual(stationStates([lesson("u1", [])], {}), ["current"]);
});

test("progress counts finished stations against the whole line, planned ones included", () => {
  assert.deepEqual(lineProgress(["done", "current", "planned", "planned"]), { done: 1, total: 4 });
  assert.deepEqual(lineProgress([]), { done: 0, total: 0 });
});

test("the home line is the route where a lesson comes soonest, then the shorter one", () => {
  const isLesson = (s: string) => s === "L";
  const long = { id: "long", steps: ["c", "c", "c", "L", "c", "c"] };
  const short = { id: "short", steps: ["c", "L", "c"] };
  const none = { id: "none", steps: ["c"] };
  assert.equal(pickLine([long, short, none], isLesson)?.id, "short");
  assert.equal(pickLine([none, { id: "tiny", steps: ["c", "L"] }, short], isLesson)?.id, "tiny");
  assert.equal(pickLine([none], isLesson)?.id, "none");
  assert.equal(pickLine([], isLesson), undefined);
});
