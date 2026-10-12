import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { EvaluationError, assembleWordOrder, evaluate, findOrderFor, normalizeAnswer } from "../src/evaluate.ts";
import type { ClozeExercise, SingleChoiceExercise, TransformExercise } from "../src/types.ts";
import { wordOrder } from "./fixtures.ts";

const base = { objective: "o1", concepts: ["concept.x.y"], prompt: "@p" as const, difficulty: 1 as const, explanation: "@e" as const };

describe("normalizeAnswer", () => {
  it("collapses whitespace, unifies quotes and ignores final punctuation", () => {
    assert.equal(normalizeAnswer("  Heute   habe ich „keine“ Zeit .  "), 'heute habe ich "keine" Zeit');
  });
  it("is case-insensitive only for the first letter", () => {
    assert.equal(normalizeAnswer("Ich wohne in Berlin"), normalizeAnswer("ich wohne in Berlin"));
    assert.notEqual(normalizeAnswer("ich wohne in berlin"), normalizeAnswer("ich wohne in Berlin"));
  });
  it("does not equate ß and ss (editorial decision via accepted variants)", () => {
    assert.notEqual(normalizeAnswer("Ich heiße Anna"), normalizeAnswer("Ich heisse Anna"));
  });
  it("applies NFC so decomposed umlauts match", () => {
    assert.equal(normalizeAnswer("Ü̈ber".slice(1)), normalizeAnswer("̈ber".normalize("NFC")));
    assert.equal(normalizeAnswer("fährt"), normalizeAnswer("fährt"));
  });
});

describe("word_order", () => {
  it("accepts every listed order and capitalises the first token", () => {
    assert.equal(assembleWordOrder(wordOrder, [2, 3, 0, 1]), "Morgen fahre ich nach Wien.");
    assert.equal(evaluate(wordOrder, { type: "word_order", order: [2, 3, 0, 1] }).correct, true);
    assert.equal(evaluate(wordOrder, { type: "word_order", order: [0, 3, 2, 1] }).correct, true);
  });
  it("returns targeted feedback and the signalled concept for a known error", () => {
    const r = evaluate(wordOrder, { type: "word_order", order: [2, 0, 3, 1] });
    assert.equal(r.correct, false);
    assert.equal(r.ruleFeedback, "@v3");
    assert.equal(r.signals, "concept.syntax.v2");
    assert.equal(r.feedback, "@no");
  });
  it("rejects incomplete or repeated orders instead of guessing", () => {
    assert.throws(() => evaluate(wordOrder, { type: "word_order", order: [0, 1, 2] }), EvaluationError);
    assert.throws(() => evaluate(wordOrder, { type: "word_order", order: [0, 0, 1, 2] }), EvaluationError);
  });
  it("findOrderFor proves buildability and refuses impossible sentences", () => {
    assert.deepEqual(findOrderFor(wordOrder, "Ich fahre morgen nach Wien."), [0, 3, 2, 1]);
    assert.equal(findOrderFor(wordOrder, "Ich fahre nach Berlin."), undefined);
  });
});

describe("single_choice", () => {
  const ex: SingleChoiceExercise = { ...base, id: "s", type: "single_choice", feedback: { correct: "@ok", incorrect: "@no" },
    options: [{ id: "a", de: "Heute ich habe frei.", correct: false, feedback: "@a" }, { id: "b", de: "Heute habe ich frei.", correct: true }] };
  it("evaluates options and surfaces distractor feedback", () => {
    assert.equal(evaluate(ex, { type: "single_choice", optionId: "b" }).correct, true);
    const r = evaluate(ex, { type: "single_choice", optionId: "a" });
    assert.equal(r.correct, false);
    assert.equal(r.ruleFeedback, "@a");
  });
  it("throws on unknown option", () => assert.throws(() => evaluate(ex, { type: "single_choice", optionId: "z" }), EvaluationError));
});

describe("cloze", () => {
  const ex: ClozeExercise = { ...base, id: "c", type: "cloze", feedback: { correct: "@ok", incorrect: "@no" }, text_de: "Deshalb {{0}} {{1}} Deutsch.",
    gaps: [{ accept: ["lerne"], rules: [{ match: ["ich"], feedback: "@g0", signals: "concept.x.y" }] }, { accept: ["ich"] }] };
  it("gives partial credit per gap", () => {
    const r = evaluate(ex, { type: "cloze", gaps: ["lerne", "du"] });
    assert.equal(r.correct, false);
    assert.equal(r.score, 0.5);
    assert.deepEqual(r.gaps?.map((g) => g.correct), [true, false]);
  });
  it("is case-sensitive inside gaps and reports rule feedback", () => {
    const r = evaluate(ex, { type: "cloze", gaps: ["ich", "lerne"] });
    assert.equal(r.ruleFeedback, "@g0");
    assert.equal(evaluate(ex, { type: "cloze", gaps: ["Lerne", "ich"] }).correct, false);
  });
  it("requires an answer for every gap", () => assert.throws(() => evaluate(ex, { type: "cloze", gaps: ["lerne"] }), EvaluationError));
});

describe("transform", () => {
  const ex: TransformExercise = { ...base, id: "t", type: "transform", source_de: "Ich gehe heute Abend ins Kino.", accept: ["Heute Abend gehe ich ins Kino."],
    feedback: { correct: "@ok", incorrect: "@no", rules: [{ match: ["Heute Abend ich gehe ins Kino."], feedback: "@v3" }] } };
  it("tolerates first-letter case, spacing and final punctuation only", () => {
    assert.equal(evaluate(ex, { type: "transform", text: "heute Abend gehe ich  ins Kino" }).correct, true);
    assert.equal(evaluate(ex, { type: "transform", text: "Heute abend gehe ich ins Kino." }).correct, false);
  });
  it("matches known error patterns", () => {
    assert.equal(evaluate(ex, { type: "transform", text: "Heute Abend ich gehe ins Kino" }).ruleFeedback, "@v3");
  });
  it("rejects a response of the wrong type", () => {
    assert.throws(() => evaluate(ex, { type: "single_choice", optionId: "a" }), EvaluationError);
  });
});
