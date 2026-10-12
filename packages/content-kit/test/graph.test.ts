import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { findPrerequisiteCycles, topologicalOrder, transitivePrerequisites } from "../src/graph.ts";
import type { Concept } from "../src/types.ts";
import { concept } from "./fixtures.ts";

const dep = (target: string) => ({ type: "depends_on" as const, target });

function graph(...cs: Concept[]) { return new Map(cs.map((c) => [c.id, c])); }

describe("prerequisite graph", () => {
  const g = graph(
    concept("concept.a.verbs"),
    concept("concept.a.v2", { relations: [dep("concept.a.verbs")] }),
    concept("concept.a.bracket", { relations: [dep("concept.a.v2"), { type: "contrasts_with", target: "concept.a.verbs" }] }),
  );
  it("orders prerequisites first, deterministically", () => {
    assert.deepEqual(topologicalOrder(g), ["concept.a.verbs", "concept.a.v2", "concept.a.bracket"]);
  });
  it("collects transitive prerequisites nearest-first", () => {
    assert.deepEqual(transitivePrerequisites(g, "concept.a.bracket"), ["concept.a.v2", "concept.a.verbs"]);
  });
  it("ignores non-prerequisite relations when detecting cycles", () => {
    assert.deepEqual(findPrerequisiteCycles(g), []);
  });
  it("detects a prerequisite cycle and topologicalOrder refuses it", () => {
    const cyc = graph(concept("concept.a.x", { relations: [dep("concept.a.y")] }), concept("concept.a.y", { relations: [dep("concept.a.x")] }));
    assert.equal(findPrerequisiteCycles(cyc).length, 1);
    assert.throws(() => topologicalOrder(cyc));
  });
});
