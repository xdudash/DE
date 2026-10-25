import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { EvaluationError, assembleTokenBankBuild, assembleWordOrder, evaluate, findOrderFor, normalizeAnswer, signalledConcepts } from "../src/evaluate.ts";
import type { CategorizeExercise, ClozeExercise, SingleChoiceExercise, TransformExercise } from "../src/types.ts";
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

describe("token_bank_build", () => {
  const exercise = {
    ...base, id: "x_bank", type: "token_bank_build" as const,
    tokens: ["heute", "ich", "lerne", "Deutsch", "morgen"],
    solutions: [[1, 2, 3, 0]],
    final_punctuation: "." as const,
  };
  it("assembles a partial bank selection and ignores unused distractors", () => {
    assert.equal(assembleTokenBankBuild(exercise, [1, 2, 3, 0]), "Ich lerne Deutsch heute.");
    assert.equal(evaluate(exercise, { type: "token_bank_build", order: [1, 2, 3, 0] }).correct, true);
  });
  it("rejects an incorrect order and invalid or repeated indices", () => {
    assert.equal(evaluate(exercise, { type: "token_bank_build", order: [1, 3, 2, 0] }).correct, false);
    assert.throws(() => assembleTokenBankBuild(exercise, [1, 1]), EvaluationError);
    assert.throws(() => assembleTokenBankBuild(exercise, [6]), EvaluationError);
    assert.throws(() => assembleTokenBankBuild(exercise, []), EvaluationError);
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

describe("signalledConcepts", () => {
  const ex: ClozeExercise = { ...base, id: "c2", type: "cloze", feedback: { correct: "@ok", incorrect: "@no" }, text_de: "{{0}} {{1}}",
    gaps: [{ accept: ["lerne"], rules: [{ match: ["ich"], feedback: "@g0", signals: "concept.x.y" }] }, { accept: ["ich"], rules: [{ match: ["lerne"], feedback: "@g1", signals: "concept.x.y" }] }] };
  it("collects the whole-answer and gap signals of a wrong answer, once each", () => {
    assert.deepEqual(signalledConcepts(evaluate(wordOrder, { type: "word_order", order: [2, 0, 3, 1] })), ["concept.syntax.v2"]);
    assert.deepEqual(signalledConcepts(evaluate(ex, { type: "cloze", gaps: ["ich", "lerne"] })), ["concept.x.y"]);
  });
  it("is empty for a correct answer and for a wrong answer no rule explains", () => {
    assert.deepEqual(signalledConcepts(evaluate(wordOrder, { type: "word_order", order: [2, 3, 0, 1] })), []);
    assert.deepEqual(signalledConcepts(evaluate(ex, { type: "cloze", gaps: ["x", "y"] })), []);
  });
});

describe("multi_choice", () => {
  const mc: import("../src/types.ts").MultiChoiceExercise = {
    ...base,
    id: "mc1",
    type: "multi_choice",
    feedback: { correct: "@ok", incorrect: "@no" },
    options: [
      { id: "a", de: "Brot", correct: true },
      { id: "b", de: "Milch", correct: true },
      { id: "c", de: "Auto", correct: false, feedback: "@car" },
      { id: "d", de: "Haus", correct: false },
    ],
  } as import("../src/types.ts").MultiChoiceExercise;

  it("is correct only when the selection equals the correct set", () => {
    assert.equal(evaluate(mc, { type: "multi_choice", optionIds: ["a", "b"] }).correct, true);
    assert.equal(evaluate(mc, { type: "multi_choice", optionIds: ["b", "a"] }).correct, true);
  });
  it("is incorrect for a missing correct option, an extra wrong option, or an empty selection", () => {
    assert.equal(evaluate(mc, { type: "multi_choice", optionIds: ["a"] }).correct, false);
    assert.equal(evaluate(mc, { type: "multi_choice", optionIds: ["a", "b", "c"] }).correct, false);
    assert.equal(evaluate(mc, { type: "multi_choice", optionIds: [] }).correct, false);
  });
  it("gives targeted feedback for a picked wrong option that has feedback", () => {
    const r = evaluate(mc, { type: "multi_choice", optionIds: ["a", "b", "c"] });
    assert.equal(r.ruleFeedback, "@car");
    assert.equal(r.feedback, "@no");
    assert.equal(r.score, 0);
  });
  it("rejects unknown and repeated ids instead of guessing", () => {
    assert.throws(() => evaluate(mc, { type: "multi_choice", optionIds: ["a", "z"] }), EvaluationError);
    assert.throws(() => evaluate(mc, { type: "multi_choice", optionIds: ["a", "a"] }), EvaluationError);
  });
});

describe("batch 1 types (ADR-0023)", () => {
  const meta = { ...base, feedback: { correct: "@ok", incorrect: "@no" } };
  it("true_false: right value is correct, wrong value gets its feedback", () => {
    const ex = { ...meta, id: "tf", type: "true_false", statement_de: "Berlin ist eine Stadt.", correct: true, wrong_feedback: "@tfw" } as import("../src/types.ts").TrueFalseExercise;
    assert.equal(evaluate(ex, { type: "true_false", value: true }).correct, true);
    const r = evaluate(ex, { type: "true_false", value: false });
    assert.equal(r.correct, false);
    assert.equal(r.ruleFeedback, "@tfw");
  });
  it("text inputs: accepted answers pass with the usual normalisation, others fail", () => {
    const ex = { ...meta, id: "ai", type: "article_input", stem_de: "Tisch", accept: ["der"] } as import("../src/types.ts").TextInputExercise;
    assert.equal(evaluate(ex, { type: "article_input", text: "Der" }).correct, true);
    assert.equal(evaluate(ex, { type: "article_input", text: "die" }).correct, false);
    assert.equal(evaluate(ex, { type: "article_input", text: "" }).correct, false);
  });
  it("match_pairs: score is the share of correct pairs; unknown and repeated rights are rejected", () => {
    const ex = { ...meta, id: "mp", type: "match_pairs", pairs: [
      { id: "a", left_de: "Hund", right_de: "Hund" }, { id: "b", left_de: "Katze", right_de: "Katze" }, { id: "c", left_de: "Maus", right_de: "Maus" }] } as import("../src/types.ts").MatchPairsExercise;
    const oneRight = evaluate(ex, { type: "match_pairs", matches: { a: "a", b: "c", c: "b" } });
    assert.equal(oneRight.correct, false);
    assert.equal(oneRight.score, 1 / 3);
    assert.throws(() => evaluate(ex, { type: "match_pairs", matches: { a: "a", b: "b", c: "a" } }), EvaluationError);
    assert.equal(evaluate(ex, { type: "match_pairs", matches: { a: "a", b: "b", c: "c" } }).correct, true);
    assert.throws(() => evaluate(ex, { type: "match_pairs", matches: { a: "z" } }), EvaluationError);
    assert.throws(() => evaluate(ex, { type: "match_pairs", matches: { a: "a", b: "a" } }), EvaluationError);
  });
  it("categorize: scores each assignment, reports row feedback, and rejects unknown ids", () => {
    const ex: CategorizeExercise = { ...base, id: "cat", type: "categorize", feedback: { correct: "@ok", incorrect: "@no" },
      categories: [{ id: "verb", label: "@verb" }, { id: "other", label: "@other" }],
      items: [{ id: "a", de: "arbeite", categoryId: "verb", feedback: "@hint" }, { id: "b", de: "heute", categoryId: "other" }] };
    const partial = evaluate(ex, { type: "categorize", assignments: { a: "other", b: "other" } });
    assert.equal(partial.correct, false);
    assert.equal(partial.score, 0.5);
    assert.equal(partial.ruleFeedback, "@hint");
    assert.deepEqual(partial.items?.map((item) => item.correct), [false, true]);
    assert.equal(evaluate(ex, { type: "categorize", assignments: { a: "verb", b: "other" } }).correct, true);
    assert.throws(() => evaluate(ex, { type: "categorize", assignments: { a: "missing" } }), EvaluationError);
  });
  it("reply_choice: behaves as a one-correct choice", () => {
    const ex = { ...meta, id: "rc", type: "reply_choice", line_de: "Danke!", options: [
      { id: "a", de: "Bitte.", correct: true }, { id: "b", de: "Tschüss.", correct: false }] } as import("../src/types.ts").ReplyChoiceExercise;
    assert.equal(evaluate(ex, { type: "reply_choice", optionId: "a" }).correct, true);
    assert.equal(evaluate(ex, { type: "reply_choice", optionId: "b" }).correct, false);
  });
  it("listening_choice: evaluates the selected interpretation", () => {
    const ex = { ...meta, id: "listen", type: "listening_choice", audio_text_de: "Heute arbeite ich.", options: [
      { id: "a", text: "@meaning.correct", correct: true }, { id: "b", text: "@meaning.wrong", correct: false }] } as import("../src/types.ts").ListeningChoiceExercise;
    assert.equal(evaluate(ex, { type: "listening_choice", optionId: "a" }).correct, true);
    assert.equal(evaluate(ex, { type: "listening_choice", optionId: "b" }).correct, false);
    assert.throws(() => evaluate(ex, { type: "listening_choice", optionId: "missing" }), EvaluationError);
  });
  it("minimal_pairs: evaluates the selected sound contrast", () => {
    const ex = { ...meta, id: "minimal", type: "minimal_pairs", audio_text_de: "schön", options: [
      { id: "a", de: "schon", correct: false }, { id: "b", de: "schön", correct: true }] } as import("../src/types.ts").MinimalPairsExercise;
    assert.equal(evaluate(ex, { type: "minimal_pairs", optionId: "b" }).correct, true);
    assert.equal(evaluate(ex, { type: "minimal_pairs", optionId: "a" }).correct, false);
    assert.throws(() => evaluate(ex, { type: "minimal_pairs", optionId: "missing" }), EvaluationError);
  });
  it("dictation: checks full phrases using the shared sentence normalization", () => {
    const ex = { ...meta, id: "dict", type: "dictation", audio_text_de: "Am Montag fahre ich zur Arbeit.", accept: ["Am Montag fahre ich zur Arbeit."] } as import("../src/types.ts").DictationExercise;
    assert.equal(evaluate(ex, { type: "dictation", text: "am Montag fahre ich zur Arbeit" }).correct, true);
    assert.equal(evaluate(ex, { type: "dictation", text: "Am Montag ich fahre zur Arbeit." }).correct, false);
  });
  it("error_correction: accepts only an authored corrected sentence", () => {
    const ex = { ...meta, id: "fix", type: "error_correction", source_de: "Heute ich arbeite zu Hause.", accept: ["Heute arbeite ich zu Hause."] } as import("../src/types.ts").ErrorCorrectionExercise;
    assert.equal(evaluate(ex, { type: "error_correction", text: "Heute arbeite ich zu Hause" }).correct, true);
    assert.equal(evaluate(ex, { type: "error_correction", text: "Heute ich arbeite zu Hause." }).correct, false);
  });
});
