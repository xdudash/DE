import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { prerequisiteGaps, recommend } from "../src/recommend.ts";
import { deriveConceptStates } from "../src/states.ts";
import { graphFromBundle, routeFromBundle } from "../src/adapters.ts";
import type { GraphConcept, RouteStep } from "../src/types.ts";
import { day, ev } from "./helpers.ts";

const A = "concept.a.verbs", B = "concept.a.v2", C = "concept.a.bracket", D = "concept.a.subordinate";
const graph: GraphConcept[] = [
  { id: A, dependsOn: [] }, { id: B, dependsOn: [A] }, { id: C, dependsOn: [B] }, { id: D, dependsOn: [B, A] },
];
const route: RouteStep[] = [
  { target: A, kind: "concept", concepts: [A] },
  { target: "unit.a.v2.a1", kind: "unit", concepts: [B] },
  { target: C, kind: "concept", concepts: [C], optional: true },
  { target: D, kind: "concept", concepts: [D] },
];
const base = { graph, route, reviewBudget: 10, limit: 10 };

describe("recommendations v1", () => {
  it("a new learner gets the first route step", () => {
    const states = deriveConceptStates(graph, [], day(0));
    assert.deepEqual(recommend({ ...base, states }), [{ target: A, kind: "concept", reason: "route_next" }]);
  });
  it("a request is preceded by catch-up for prerequisite gaps, foundations first", () => {
    const states = deriveConceptStates(graph, [], day(0));
    assert.deepEqual(prerequisiteGaps(graph, states, D), [A, B]);
    const r = recommend({ ...base, states, request: D, limit: 3 });
    assert.deepEqual(r.map((x) => [x.target, x.reason, x.reasonRef]), [[A, "prerequisite_of", D], [B, "prerequisite_of", D], [D, "requested", undefined]]);
  });
  it("prerequisites already practised successfully are not repeated", () => {
    const states = deriveConceptStates(graph, [ev("attempt", day(0), A, true), ev("attempt", day(0), B, true)], day(0));
    assert.deepEqual(prerequisiteGaps(graph, states, D), []);
  });
  it("due reviews come before weak concepts and the route; budget limits reviews", () => {
    const events = [
      ev("attempt", day(0), A, true),
      ev("attempt", day(2), B, true),
      ...[0, 1, 2].map(() => ev("attempt", day(4), C, false)),
    ];
    const states = deriveConceptStates(graph, events, day(4));
    const r = recommend({ ...base, states });
    assert.deepEqual(r.map((x) => [x.target, x.reason]), [[A, "review_due"], [B, "review_due"], [C, "frequent_error"], [D, "route_next"]]);
    const limited = recommend({ ...base, states, reviewBudget: 1 });
    assert.deepEqual(limited.filter((x) => x.reason === "review_due").map((x) => x.target), [A], "most overdue first");
  });
  it("skips optional route steps when a required one is pending, and never duplicates targets", () => {
    const events = [
      ev("attempt", day(0), A, true), ev("recall", day(1), A, true), ev("recall", day(4), A, true),
      ev("attempt", day(0), B, true), ev("recall", day(1), B, true), ev("recall", day(4), B, true),
    ];
    const states = deriveConceptStates(graph, events, day(5));
    const r = recommend({ ...base, states, request: D });
    assert.deepEqual(r.map((x) => [x.target, x.reason]), [[D, "requested"]], "D is both requested and route_next: listed once");
  });
  it("respects the limit", () => {
    const states = deriveConceptStates(graph, [], day(0));
    assert.equal(recommend({ ...base, states, request: D, limit: 1 }).length, 1);
  });
});

describe("bundle adapters", () => {
  const bundle = {
    concepts: [
      { id: A, relations: [] },
      { id: B, relations: [{ type: "depends_on", target: A }, { type: "contrasts_with", target: C }] },
    ],
    units: [{ id: "unit.a.v2.a1", concepts: [B] }],
    routes: [{ id: "route.a.core", steps: [{ concept: A }, { unit: "unit.a.v2.a1" }, { concept: C, optional: true }] }],
  } as never;
  it("keeps only depends_on edges", () => {
    assert.deepEqual(graphFromBundle(bundle), [{ id: A, dependsOn: [] }, { id: B, dependsOn: [A] }]);
  });
  it("maps unit steps to their concepts", () => {
    assert.deepEqual(routeFromBundle(bundle, "route.a.core"), [
      { target: A, kind: "concept", concepts: [A] },
      { target: "unit.a.v2.a1", kind: "unit", concepts: [B] },
      { target: C, kind: "concept", concepts: [C], optional: true },
    ]);
    assert.throws(() => routeFromBundle(bundle, "route.nope"));
  });
});
