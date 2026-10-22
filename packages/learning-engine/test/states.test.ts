import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { deriveConceptStates } from "../src/states.ts";
import type { GraphConcept } from "../src/types.ts";
import { day, ev } from "./helpers.ts";

const VERB = "concept.morph.verbs";
const V2 = "concept.syntax.v2";
const W = "concept.syntax.w_questions";
const graph: GraphConcept[] = [
  { id: VERB, dependsOn: [] },
  { id: V2, dependsOn: [VERB] },
  { id: W, dependsOn: [V2] },
];
const state = (events: Parameters<typeof deriveConceptStates>[1], now: number, id = V2) => deriveConceptStates(graph, events, now).get(id)!;

describe("concept states v1", () => {
  it("unseen without evidence; a root concept is available", () => {
    const s = deriveConceptStates(graph, [], day(0));
    assert.equal(s.get(VERB)!.state, "available");
    assert.equal(s.get(V2)!.state, "unseen");
    assert.equal(s.get(V2)!.because, "no_evidence");
  });
  it("becomes available once every prerequisite has a correct result", () => {
    const s = deriveConceptStates(graph, [ev("attempt", day(0), VERB, true)], day(0));
    assert.equal(s.get(V2)!.state, "available");
    assert.equal(s.get(V2)!.because, "prerequisites_met");
    assert.equal(s.get(W)!.state, "unseen");
  });
  it("exposure alone is in_progress, never mastery; self-reports are ignored", () => {
    assert.equal(state([ev("exposure", day(0), V2)], day(0)).state, "in_progress");
    assert.equal(state([ev("self_report", day(0), V2)], day(0)).state, "unseen");
  });
  it("needs_practice when recent accuracy < 70 % over ≥3 results", () => {
    const e = [ev("attempt", day(0), V2, true), ev("attempt", day(0), V2, false), ev("attempt", day(0), V2, false)];
    const s = state(e, day(0));
    assert.equal(s.state, "needs_practice");
    assert.equal(s.because, "low_recent_accuracy");
    assert.equal(s.evidence.recentAccuracy, 1 / 3);
  });
  it("two wrong answers alone are not enough evidence for needs_practice", () => {
    assert.equal(state([ev("attempt", day(0), V2, false), ev("attempt", day(0), V2, false)], day(0)).state, "in_progress");
  });
  it("only the last 5 results count, so a learner can recover", () => {
    const e = [0, 1, 2].map(() => ev("attempt", day(0), V2, false)).concat([0, 1, 2, 3, 4].map(() => ev("attempt", day(0) + 1000, V2, true)));
    assert.equal(state(e, day(0) + 2000).state, "in_progress");
  });
  it("needs_practice when an error rule signals the concept twice within 7 days, even from another unit", () => {
    const e = [
      ev("attempt", day(0), V2, true),
      ev("attempt", day(1), "concept.other", false, { signals: [V2] }),
      ev("attempt", day(2), "concept.other", false, { signals: [V2] }),
    ];
    const s = state(e, day(2));
    assert.equal(s.state, "needs_practice");
    assert.equal(s.because, "repeated_signalled_error");
    assert.equal(state(e, day(9) + 1).state !== "needs_practice", true, "signals older than 7 days expire");
  });
  it("review_due once the schedule's due date passes", () => {
    const e = [ev("attempt", day(0), V2, true)];
    assert.equal(state(e, day(1) - 1).state, "in_progress");
    const s = state(e, day(1));
    assert.equal(s.state, "review_due");
    assert.equal(s.because, "review_overdue");
  });
  it("provisionally_mastered after 2 on-time successful recalls ≥1 day apart", () => {
    const e = [ev("attempt", day(0), V2, true), ev("recall", day(1), V2, true), ev("recall", day(4), V2, true)];
    const s = state(e, day(5));
    assert.equal(s.state, "provisionally_mastered");
    assert.equal(s.because, "delayed_recall_confirmed");
    assert.equal(s.evidence.review!.dueAt, day(11));
    assert.equal(state(e, day(11)).state, "review_due", "mastery decays into review");
  });
  it("same-day recalls do not prove delayed recall", () => {
    const e = [ev("attempt", day(0), V2, true), ev("recall", day(0) + 1000, V2, true), ev("recall", day(0) + 2000, V2, true)];
    assert.equal(state(e, day(0) + 3000).state, "in_progress");
  });
  it("a failed latest recall revokes mastery", () => {
    const e = [ev("attempt", day(0), V2, true), ev("recall", day(1), V2, true), ev("recall", day(4), V2, true), ev("recall", day(11), V2, false)];
    assert.notEqual(state(e, day(11) + 1).state, "provisionally_mastered");
  });
  it("ignores events from the future and is independent of event order", () => {
    const e = [ev("attempt", day(0), V2, true), ev("attempt", day(3), V2, false)];
    assert.deepEqual(state(e, day(0) + 1), state([...e].reverse(), day(0) + 1));
    assert.equal(state(e, day(0) + 1).evidence.attempts, 1);
  });

  describe("mastery from ordinary answers (ADR-0016)", () => {
    it("a learner who only answers exercises reaches provisionally_mastered through due reviews", () => {
      const e = [ev("attempt", day(0), V2, true), ev("attempt", day(1), V2, true), ev("attempt", day(4), V2, true)];
      const s = state(e, day(5));
      assert.equal(s.state, "provisionally_mastered");
      assert.equal(s.evidence.recalls, 2);
      assert.equal(s.evidence.successfulRecalls, 2);
      assert.equal(state(e, day(11)).state, "review_due", "mastery still decays into review");
    });
    it("repeating a lesson the same day is practice, not proof", () => {
      const e = [0, 1, 2, 3, 4, 5].map((i) => ev("attempt", day(0) + i * 60_000, V2, true));
      const s = state(e, day(0) + 3_600_000);
      assert.equal(s.state, "in_progress");
      assert.equal(s.evidence.recalls, 0);
    });
    it("a wrong answer while due revokes mastery", () => {
      const e = [ev("attempt", day(0), V2, true), ev("attempt", day(1), V2, true), ev("attempt", day(4), V2, true)];
      assert.equal(state(e, day(10)).state, "provisionally_mastered");
      const s = state([...e, ev("attempt", day(11), V2, false)], day(11) + 1);
      assert.equal(s.state, "in_progress");
      assert.equal(s.evidence.review!.dueAt, day(12));
    });
    it("an early explicit recall earns no mastery credit", () => {
      const e = [ev("attempt", day(0), V2, true), ev("recall", day(0) + 60_000, V2, true), ev("attempt", day(1) + 3_600_000, V2, true)];
      const s = state(e, day(2));
      assert.equal(s.state, "in_progress");
      assert.equal(s.evidence.recalls, 1);
    });
    it("an answer tagged with several concepts reviews each of them", () => {
      const both = (at: number) => ev("attempt", at, V2, true, { conceptIds: [V2, W] });
      const s = deriveConceptStates(graph, [both(day(0)), both(day(1)), both(day(4))], day(5));
      assert.equal(s.get(V2)!.state, "provisionally_mastered");
      assert.equal(s.get(W)!.state, "provisionally_mastered");
    });
  });
});
