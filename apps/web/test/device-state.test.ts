import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import {
  MAX_STORED_ATTEMPTS,
  clearDeviceData,
  readAttempts,
  readLanguage,
  readLessonResults,
  readSetup,
  recordAttempt,
  writeLanguage,
  writeSetup,
} from "../lib/device-state.ts";

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
      removeItem: (k: string) => {
        data.delete(k);
      },
      key: (index: number) => [...data.keys()][index] ?? null,
      get length() { return data.size; },
    },
    dispatchEvent: () => true,
  };
  return data;
}

const EVENTS = "deutschgo.events.v1";
const SETUP = "deutschgo.setup.v1";

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
    installStorage({ corrupt: { [SETUP]: JSON.stringify({ goal: "fame", minutes: 10 }) } });
    assert.equal(readSetup(), null);
    installStorage({ corrupt: { [SETUP]: JSON.stringify({ goal: "life", minutes: 7 }) } });
    assert.equal(readSetup(), null);
  });

  it("treats unreadable stored JSON as no plan instead of throwing", () => {
    installStorage({ corrupt: { [SETUP]: "{not json" } });
    assert.equal(readSetup(), null);
  });

  it("reports a failed write instead of claiming success", () => {
    installStorage({ failWrites: true });
    assert.equal(writeSetup({ goal: "study", minutes: 5 }), false);
  });
});

describe("attempts as learning evidence", () => {
  beforeEach(() => installStorage());

  it("starts empty", () => {
    assert.deepEqual(readAttempts(), []);
    assert.deepEqual(readLessonResults("unit.x"), {});
  });

  it("stores each attempt as an append-only engine event with its concepts", () => {
    assert.equal(recordAttempt({ unitId: "unit.x", exerciseId: "ex1", conceptIds: ["concept.a"], correct: false }), true);
    const [event] = readAttempts();
    assert.ok(event);
    assert.equal(event.kind, "attempt");
    assert.equal(event.correct, false);
    assert.equal(event.unitId, "unit.x");
    assert.equal(event.exerciseId, "ex1");
    assert.deepEqual(event.conceptIds, ["concept.a"]);
    assert.equal(event.skill, "knowledge");
    assert.equal(typeof event.at, "number");
    assert.ok(event.id.length > 0);
  });

  it("derives the latest result per exercise and keeps lessons apart", () => {
    recordAttempt({ unitId: "unit.x", exerciseId: "ex1", conceptIds: [], correct: false });
    recordAttempt({ unitId: "unit.x", exerciseId: "ex1", conceptIds: [], correct: true });
    recordAttempt({ unitId: "unit.x", exerciseId: "ex2", conceptIds: [], correct: false });
    recordAttempt({ unitId: "unit.y", exerciseId: "ex9", conceptIds: [], correct: true });
    assert.deepEqual(readLessonResults("unit.x"), { ex1: true, ex2: false });
    assert.deepEqual(readLessonResults("unit.y"), { ex9: true });
  });

  it("drops corrupt entries instead of trusting them", () => {
    installStorage({
      corrupt: {
        [EVENTS]: JSON.stringify([
          { kind: "attempt", id: "a", at: 1, unitId: "unit.x", exerciseId: "ex1", correct: true, conceptIds: [] },
          { kind: "attempt", id: "b", at: 2, unitId: "unit.x", exerciseId: "ex2", correct: "yes", conceptIds: [] },
          { kind: "exposure", id: "c" },
          null,
        ]),
      },
    });
    assert.deepEqual(readLessonResults("unit.x"), { ex1: true });
    assert.equal(readAttempts().length, 1);
  });

  it("treats a stored non-array as no evidence", () => {
    installStorage({ corrupt: { [EVENTS]: "42" } });
    assert.deepEqual(readAttempts(), []);
  });

  it("reports a failed write so the caller can say so", () => {
    installStorage({ failWrites: true });
    assert.equal(recordAttempt({ unitId: "unit.x", exerciseId: "ex1", conceptIds: [], correct: true }), false);
    assert.deepEqual(readLessonResults("unit.x"), {});
  });

  it("bounds storage: only the most recent attempts are kept", () => {
    const stored = Array.from({ length: MAX_STORED_ATTEMPTS }, (_, i) => ({
      kind: "attempt", id: `old${i}`, at: i, unitId: "unit.old", exerciseId: `e${i}`, correct: true, conceptIds: [],
    }));
    installStorage({ corrupt: { [EVENTS]: JSON.stringify(stored) } });
    recordAttempt({ unitId: "unit.new", exerciseId: "fresh", conceptIds: [], correct: false });
    const all = readAttempts();
    assert.equal(all.length, MAX_STORED_ATTEMPTS);
    assert.equal(all.at(-1)?.exerciseId, "fresh");
    assert.equal(all[0]?.id, "old1");
  });
});

describe("remembered explanation language", () => {
  const OFFERED = ["en", "uk", "ru"];
  beforeEach(() => installStorage());

  it("has no language before the learner picks one", () => {
    assert.equal(readLanguage(OFFERED), null);
  });

  it("round-trips a language the app offers", () => {
    assert.equal(writeLanguage("uk"), true);
    assert.equal(readLanguage(OFFERED), "uk");
  });

  it("ignores a language that is no longer offered", () => {
    writeLanguage("uk");
    assert.equal(readLanguage(["en", "ru"]), null);
  });

  it("ignores a stored value that is not a language code", () => {
    installStorage({ corrupt: { "deutschgo.language.v1": JSON.stringify({ code: "uk" }) } });
    assert.equal(readLanguage(OFFERED), null);
  });

  it("reports a failed write instead of claiming success", () => {
    installStorage({ failWrites: true });
    assert.equal(writeLanguage("ru"), false);
  });
});

describe("one identity per answer (DG-022)", () => {
  beforeEach(() => installStorage());

  it("keeps the given event id and time, shared with the account's copy", () => {
    const id = "123e4567-e89b-42d3-a456-426614174000";
    recordAttempt({ id, at: 1_700_000_000_000, unitId: "unit.x", exerciseId: "ex1", conceptIds: ["concept.a"], correct: true, response: { type: "single_choice", optionId: "a" }, contentVersion: "1.0.0" });
    const [event] = readAttempts();
    assert.equal(event!.id, id);
    assert.equal(event!.at, 1_700_000_000_000);
    assert.deepEqual(event!.response, { type: "single_choice", optionId: "a" });
    assert.equal(event!.contentVersion, "1.0.0");
  });

  it("stores error-rule signals for wrong answers only, like the server", () => {
    recordAttempt({ unitId: "unit.x", exerciseId: "ex1", conceptIds: ["concept.a"], correct: false, signals: ["concept.b"] });
    recordAttempt({ unitId: "unit.x", exerciseId: "ex2", conceptIds: ["concept.a"], correct: true, signals: ["concept.b"] });
    const [wrong, right] = readAttempts();
    assert.deepEqual(wrong!.signals, ["concept.b"]);
    assert.equal(right!.signals, undefined);
  });

  it("drops stored events whose signals are not a list of ids", () => {
    const bad = { id: "e1", kind: "attempt", at: 1, unitId: "u", exerciseId: "x", correct: false, conceptIds: [], signals: "concept.b" };
    installStorage({ corrupt: { [EVENTS]: JSON.stringify([bad]) } });
    assert.deepEqual(readAttempts(), []);
  });

  it("deleting this device's data also empties the outbox of unsent answers", () => {
    const data = installStorage({ corrupt: { "deutschgo.outbox.v1": "[]", "deutschgo-writing-v1:ru": JSON.stringify({ drafts: {} }) } });
    assert.equal(clearDeviceData(), true);
    assert.equal(data.has("deutschgo.outbox.v1"), false);
    assert.equal(data.has("deutschgo-writing-v1:ru"), false);
  });
});
