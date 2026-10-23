import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { GOALS, REGIONS, normalizeSetup } from "../lib/plan.ts";

describe("plan goals and regions (DG-029)", () => {
  it("uses the five spec goals and the database region names", () => {
    assert.deepEqual([...GOALS], ["general", "everyday", "work", "study", "exam"]);
    assert.deepEqual([...REGIONS], ["standard", "de-DE", "de-AT", "de-CH"]);
  });

  it("accepts a complete plan unchanged", () => {
    assert.deepEqual(normalizeSetup({ goal: "exam", region: "de-AT", minutes: 15 }), { goal: "exam", region: "de-AT", minutes: 15 });
  });

  it("reads a plan saved before regions existed as the standard region", () => {
    assert.deepEqual(normalizeSetup({ goal: "work", minutes: 10 }), { goal: "work", region: "standard", minutes: 10 });
  });

  it("reads the first version's 'life' goal as everyday", () => {
    assert.deepEqual(normalizeSetup({ goal: "life", minutes: 5 }), { goal: "everyday", region: "standard", minutes: 5 });
  });

  it("refuses anything that is not a complete, valid plan", () => {
    assert.equal(normalizeSetup(null), null);
    assert.equal(normalizeSetup("work"), null);
    assert.equal(normalizeSetup({ goal: "travel", minutes: 10 }), null);
    assert.equal(normalizeSetup({ goal: "work", minutes: 7 }), null);
    assert.equal(normalizeSetup({ goal: "work", minutes: "10" }), null);
    assert.equal(normalizeSetup({ goal: "work", region: "de-DE-x", minutes: 10 }), null);
    assert.equal(normalizeSetup({ minutes: 10 }), null);
  });
});
