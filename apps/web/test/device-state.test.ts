import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { readLessonResults, readSetup, recordExerciseResult, writeSetup } from "../lib/device-state.ts";

/** Minimal in-memory localStorage, installed on the global window for each test. */
function installStorage(options: { failWrites?: boolean; corrupt?: Record<string, string> } = {}) {
  const data = new Map<string, string>(Object.entries(options.corrupt ?? {}));
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
      setItem: (k: string, v: string) => {
        if (options.failWrites) throw new Error("QuotaExceededError");
        data.set(k, v);
      },
    },
  };
  return data;
}

describe("first-visit setup", () => {
  beforeEach(() => installStorage());

  it("returns null when nothing was saved", () => {
    assert.equal(readSetup(), null);
  });

  it("round-trips a valid plan", () => {
    assert.equal(writeSetup({ goal: "work", minutes: 15 }), true);
    assert.deepEqual(readSetup(), { goal: "work", minutes: 15 });
  });

  it("ignores a stored plan with an unknown goal or an unsupported duration", () => {
    installStorage({ corrupt: { "deutschgo.setup.v1": JSON.stringify({ goal: "fame", minutes: 10 }) } });
    assert.equal(readSetup(), null);
    installStorage({ corrupt: { "deutschgo.setup.v1": JSON.stringify({ goal: "life", minutes: 7 }) } });
    assert.equal(readSetup(), null);
  });

  it("treats unreadable stored JSON as no plan instead of throwing", () => {
    installStorage({ corrupt: { "deutschgo.setup.v1": "{not json" } });
    assert.equal(readSetup(), null);
  });

  it("reports a failed write instead of claiming success", () => {
    installStorage({ failWrites: true });
    assert.equal(writeSetup({ goal: "study", minutes: 5 }), false);
  });
});

describe("lesson results on this device", () => {
  beforeEach(() => installStorage());

  it("is empty for a lesson nobody has answered", () => {
    assert.deepEqual(readLessonResults("unit.x"), {});
  });

  it("keeps the latest answer per exercise and does not mix lessons", () => {
    recordExerciseResult("unit.x", "ex1", false);
    recordExerciseResult("unit.x", "ex1", true);
    recordExerciseResult("unit.x", "ex2", false);
    recordExerciseResult("unit.y", "ex9", true);
    assert.deepEqual(readLessonResults("unit.x"), { ex1: true, ex2: false });
    assert.deepEqual(readLessonResults("unit.y"), { ex9: true });
  });

  it("reports a failed write so the caller can say so", () => {
    installStorage({ failWrites: true });
    assert.equal(recordExerciseResult("unit.x", "ex1", true), false);
    assert.deepEqual(readLessonResults("unit.x"), {});
  });

  it("treats a stored non-object as empty", () => {
    installStorage({ corrupt: { "deutschgo.lesson.v1.unit.x": "42" } });
    assert.deepEqual(readLessonResults("unit.x"), {});
  });
});
