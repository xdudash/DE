import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { buildPlan, type CourseLesson } from "../lib/topic-choices.ts";

const L = (id: string, depth: CourseLesson["depth"], topic: string, builds: string[] = [], kind: CourseLesson["kind"] = "lesson"): CourseLesson =>
  ({ id, kind, depth, topic, previous: "—", builds_on: builds });

const course: CourseLesson[] = [
  L("A1.01.01", "core", "nominativ", []),
  L("A1.01.02", "standard", "nominativ"),
  L("A1.01.03", "deep", "akkusativ", ["nominativ"]),
  L("A1.01.04", "core", "akkusativ", ["nominativ"]),
  L("A1.01.05", "standard", "dativ", ["akkusativ"]),
  L("A1.01.CP", "core", "checkpoint:A1.01", [], "checkpoint"),
];
const ids = (p: { lessons: readonly { id: string }[] }) => p.lessons.map((l) => l.id);

describe("tiers", () => {
  it("fast keeps core lessons and checkpoints", () => {
    assert.deepEqual(ids(buildPlan(course, "fast", {})), ["A1.01.01", "A1.01.04", "A1.01.CP"]);
  });

  it("medium adds standard, full keeps everything", () => {
    assert.deepEqual(ids(buildPlan(course, "medium", {})), ["A1.01.01", "A1.01.02", "A1.01.04", "A1.01.05", "A1.01.CP"]);
    assert.equal(buildPlan(course, "full", {}).lessons.length, course.length);
  });

  it("records why a lesson was dropped", () => {
    const plan = buildPlan(course, "fast", {});
    assert.deepEqual(plan.dropped.find((d) => d.id === "A1.01.03"), { id: "A1.01.03", reason: "tier" });
  });
});

describe("want and skip", () => {
  it("want brings a deep lesson into the fast tier", () => {
    const plan = buildPlan(course, "fast", { akkusativ: "want" });
    assert.ok(ids(plan).includes("A1.01.03"));
  });

  it("skip removes every lesson of that topic, even a core one", () => {
    const plan = buildPlan(course, "full", { akkusativ: "skip" });
    assert.deepEqual(ids(plan), ["A1.01.01", "A1.01.02", "A1.01.05", "A1.01.CP"]);
    assert.deepEqual(plan.dropped.filter((d) => d.reason === "skipped").map((d) => d.id), ["A1.01.03", "A1.01.04"]);
  });

  it("want wins over a tier, and skip is never overridden by a tier", () => {
    const plan = buildPlan(course, "full", { nominativ: "skip", akkusativ: "want" });
    assert.ok(!ids(plan).includes("A1.01.01"));
    assert.ok(ids(plan).includes("A1.01.03"));
  });
});

describe("dependencies", () => {
  it("reports a kept lesson that builds on a skipped topic instead of hiding it", () => {
    const plan = buildPlan(course, "full", { nominativ: "skip" });
    const kept = ids(plan);
    assert.ok(kept.includes("A1.01.03"));
    assert.deepEqual(plan.conflicts.map((c) => `${c.id}:${c.topic}`), ["A1.01.03:nominativ", "A1.01.04:nominativ"]);
  });

  it("no conflicts when nothing kept depends on a skipped topic", () => {
    assert.deepEqual(buildPlan(course, "full", { dativ: "skip" }).conflicts, []);
  });

  it("rebuilds the chain over kept lessons, so previous always points at a kept lesson", () => {
    const plan = buildPlan(course, "fast", {});
    assert.deepEqual(plan.lessons.map((l) => [l.id, l.previous]), [
      ["A1.01.01", "—"],
      ["A1.01.04", "A1.01.01"],
      ["A1.01.CP", "A1.01.04"],
    ]);
  });

  it("an empty course gives an empty plan", () => {
    assert.deepEqual(buildPlan([], "full", {}), { lessons: [], dropped: [], conflicts: [] });
  });
});
