import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { GOALS, normalizeSetup } from "../lib/plan.ts";

describe("plan goals (DG-029, ADR-0020)", () => {
  it("uses the five spec goals and no region", () => {
    assert.deepEqual([...GOALS], ["general", "everyday", "work", "study", "exam"]);
  });

  it("keeps older plans and defaults their course depth to medium", () => {
    assert.deepEqual(normalizeSetup({ goal: "exam", minutes: 15 }), { goal: "exam", minutes: 15, difficulty: "medium" });
    assert.deepEqual(normalizeSetup({ goal: "work", minutes: 10, difficulty: "hard" }), { goal: "work", minutes: 10, difficulty: "hard" });
  });

  it("reads the first version's 'life' goal as everyday", () => {
    assert.deepEqual(normalizeSetup({ goal: "life", minutes: 5 }), { goal: "everyday", minutes: 5, difficulty: "medium" });
  });

  it("ignores a region saved by an earlier version", () => {
    assert.deepEqual(normalizeSetup({ goal: "work", region: "de-AT", minutes: 10 }), { goal: "work", minutes: 10, difficulty: "medium" });
  });

  it("refuses anything that is not a complete, valid plan", () => {
    assert.equal(normalizeSetup(null), null);
    assert.equal(normalizeSetup("work"), null);
    assert.equal(normalizeSetup({ goal: "travel", minutes: 10 }), null);
    assert.equal(normalizeSetup({ goal: "work", minutes: 7 }), null);
    assert.equal(normalizeSetup({ goal: "work", minutes: "10" }), null);
    assert.equal(normalizeSetup({ minutes: 10 }), null);
  });
});
