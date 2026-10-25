import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { runChecks } from "../src/checks.ts";
import { duplicateTitles, estimateMinutes, lessonNorms, promptTemplate, rhythmSimilarity } from "../src/norms.ts";
import type { Exercise, Unit } from "../src/types.ts";
import { l10n, unit, validRepo } from "./fixtures.ts";

const C = "concept.syntax.v2";
type Ref = `@${string}`;
const ref = (key: string): Ref => `@${key}`;
const base = (id: string) => ({
  id, objective: "o1", concepts: [C], prompt: ref(`${id}.prompt`), difficulty: 1 as const,
  feedback: { correct: ref("ok"), incorrect: ref("no") }, explanation: ref(`${id}.expl`),
});
type Option = { id: string; de?: string; correct: boolean; feedback?: Ref };
const opts = (id: string): Option[] => [
  { id: "a", de: "eins", correct: true },
  { id: "b", de: "zwei", correct: false, feedback: ref(`${id}.b`) },
  { id: "c", de: "drei", correct: false, feedback: ref(`${id}.c`) },
];

/** One exercise of the given type, valid for the evaluator. */
function make(type: Exercise["type"], id: string): Exercise {
  const b = base(id);
  switch (type) {
    case "single_choice": return { ...b, type, options: opts(id) };
    case "reply_choice": return { ...b, type, line_de: "Hallo!", options: opts(id) };
    case "multi_choice": return { ...b, type, options: [{ id: "a", de: "eins", correct: true }, { id: "b", de: "fünf", correct: true }, { id: "c", de: "acht", correct: false, feedback: ref(`${id}.c`) }] };
    case "true_false": return { ...b, type, statement_de: "Eins ist 1.", correct: true, wrong_feedback: ref(`${id}.wrong`) };
    case "match_pairs": return { ...b, type, pairs: [{ id: "a", left_de: "eins", right_de: "1" }, { id: "b", left_de: "zwei", right_de: "2" }] };
    case "number_input": return { ...b, type, accept: ["3"] };
    case "spelling_input": return { ...b, type, accept: ["vier"] };
    default: throw new Error(`no fixture for ${type}`);
  }
}

/** Types in an order that meets every norm: no neighbours alike, no three shapes alike in a row. */
const GOOD_ORDER: Exercise["type"][] = [
  "single_choice", "number_input", "true_false", "match_pairs", "multi_choice", "spelling_input", "reply_choice", "number_input",
  "single_choice", "match_pairs", "true_false", "spelling_input", "multi_choice", "number_input", "reply_choice",
];
const WORDS = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel", "india", "juliet", "kilo", "lima", "mike", "november", "oscar", "papa"];

function a0Lesson(types: Exercise["type"][] = GOOD_ORDER, examples = 5): { u: Unit; strings: Record<string, string> } {
  const items = types.map((t, i) => make(t, `x${i + 1}`));
  const u = unit({
    id: "unit.lex.test_a0", cefr: "A0", estimated_minutes: 8,
    blocks: [
      { type: "explanation", id: "b_intro", body: ref("intro") },
      { type: "examples", id: "b_ex", title: "@ex", items: Array.from({ length: examples }, (_, i) => ({ id: `e${i}`, de: `Beispiel ${i}`, gloss: "@g" })) },
      { type: "explanation", id: "b_sum", body: "@sum" },
      { type: "exercises", id: "b1", title: "@b1", items },
    ],
  });
  const strings: Record<string, string> = { title: "Test lesson" };
  items.forEach((ex, i) => { strings[`${ex.id}.prompt`] = `Task ${WORDS[i]}.`; });
  return { u, strings };
}
const codes = (u: Unit, s: Record<string, string>) => lessonNorms(u, s).map((f) => f.code);
const exs = (u: Unit) => (u.blocks.find((b) => b.type === "exercises") as { items: Exercise[] }).items;

describe("lesson norms (A0)", () => {
  it("accepts a lesson that meets every norm", () => {
    const { u, strings } = a0Lesson();
    assert.equal(estimateMinutes(u), 8);
    assert.deepEqual(codes(u, strings), []);
  });
  it("does not apply A0 norms to other levels", () => {
    const { u, strings } = a0Lesson(["single_choice", "single_choice"], 1);
    u.cefr = "A1";
    assert.deepEqual(codes(u, strings), []);
  });
  it("reports two exercises of the same type next to each other", () => {
    const order = [...GOOD_ORDER];
    order[1] = "single_choice"; // x1 and x2 are both single_choice
    order[7] = "spelling_input"; // keep the type counts within limits
    const { u, strings } = a0Lesson(order);
    assert.ok(codes(u, strings).includes("norm.adjacent_type"));
  });
  it("reports three option lists in a row even when their types differ", () => {
    const order = [...GOOD_ORDER];
    order[1] = "true_false"; order[2] = "multi_choice"; // single_choice, true_false, multi_choice
    order[4] = "number_input";
    const { u, strings } = a0Lesson(order);
    const c = codes(u, strings);
    assert.ok(c.includes("norm.shape_run"), c.join());
    assert.ok(!c.includes("norm.adjacent_type"));
  });
  it("reports the same question asked three times with different numbers", () => {
    const { u, strings } = a0Lesson();
    strings["x1.prompt"] = "Which word means 3?";
    strings["x9.prompt"] = "Which word means 30?";
    strings["x13.prompt"] = "Which word means 40?";
    assert.ok(codes(u, strings).includes("norm.prompt_template"));
  });
  it("allows the same wording twice", () => {
    const { u, strings } = a0Lesson();
    strings["x1.prompt"] = "Which word means 3?";
    strings["x9.prompt"] = "Which word means 30?";
    assert.deepEqual(codes(u, strings), []);
  });
  it("reports a lesson below the exercise count and example count", () => {
    const { u, strings } = a0Lesson(GOOD_ORDER.slice(0, 10), 3);
    const c = codes(u, strings);
    assert.ok(c.includes("norm.exercise_count"));
    assert.ok(c.includes("norm.examples"));
  });
  it("reports a typed estimate that differs from the formula", () => {
    const { u, strings } = a0Lesson();
    u.estimated_minutes = 12;
    assert.ok(codes(u, strings).includes("norm.minutes_mismatch"));
  });
  it("reports one type used more than a quarter of the time", () => {
    const order = [...GOOD_ORDER];
    order[4] = "number_input"; order[10] = "number_input"; // number_input at 1, 4, 7, 10, 13
    order[5] = "multi_choice"; order[11] = "true_false";
    const { u, strings } = a0Lesson(order);
    assert.ok(codes(u, strings).includes("norm.type_share"), codes(u, strings).join());
  });
  it("reports fewer than four exercise types", () => {
    const three: Exercise["type"][] = Array.from({ length: 15 }, (_, i) => (["single_choice", "number_input", "match_pairs"] as const)[i % 3]!);
    const { u, strings } = a0Lesson(three);
    assert.ok(codes(u, strings).includes("norm.type_variety"));
  });
  it("reports generic feedback shared by several wrong options", () => {
    const { u, strings } = a0Lesson();
    const first = exs(u)[0] as Extract<Exercise, { type: "single_choice" }>;
    for (const o of first.options) if (!o.correct) o.feedback = "@fb.not_this";
    assert.ok(codes(u, strings).includes("norm.generic_feedback"));
  });
  it("reports a true/false exercise without feedback for the wrong pick", () => {
    const { u, strings } = a0Lesson();
    const tf = exs(u)[2] as Extract<Exercise, { type: "true_false" }>;
    delete tf.wrong_feedback;
    assert.ok(codes(u, strings).includes("norm.distractor_feedback"));
  });
});

describe("prompt templates", () => {
  const german = new Set(["drei", "zwei"]);
  it("treats numbers, quotes and German words as the variable part", () => {
    assert.equal(promptTemplate("Which word means 30?", german), promptTemplate("Which word means 40?", german));
    assert.equal(promptTemplate("Which number comes after drei?", german), promptTemplate("Which number comes after zwei?", german));
    assert.equal(promptTemplate("What does “Bis bald” mean?", german), promptTemplate("What does “Tschüss” mean?", german));
  });
  it("keeps different questions apart", () => {
    assert.notEqual(promptTemplate("Which word means 3?", german), promptTemplate("Write the word for 3.", german));
  });
});

describe("duplicate titles", () => {
  it("groups units with the same title, ignoring case", () => {
    const groups = duplicateTitles(new Map([["a", "Numbers 0 to 5"], ["b", "numbers 0 to 5"], ["c", "Days"]]));
    assert.deepEqual(groups, [["a", "b"]]);
  });
});

describe("norms in runChecks", () => {
  const withLesson = (id: string) => {
    const repo = validRepo();
    const { u, strings } = a0Lesson(GOOD_ORDER.slice(0, 10));
    u.id = id;
    repo.units.set(id, u);
    repo.l10n.set(`en:${id}`, { ...l10n(id, "en", []), strings });
    return runChecks(repo).issues.filter((i) => i.code.startsWith("norm."));
  };
  it("reports a lesson below the norm as an error", () => {
    const issues = withLesson("unit.lex.test_a0");
    assert.ok(issues.some((i) => i.code === "norm.exercise_count" && i.severity === "error"));
  });
  it("keeps an exempt unit at warning level", () => {
    const issues = withLesson("unit.pron.alphabet_a0");
    assert.ok(issues.length > 0);
    assert.ok(issues.every((i) => i.severity === "warning"));
  });
});

describe("rhythm across neighbouring lessons", () => {
  const routeWith = (second: Exercise["type"][]) => {
    const repo = validRepo();
    const a = a0Lesson().u; a.id = "unit.lex.test_a";
    const b = a0Lesson(second).u; b.id = "unit.lex.test_b";
    repo.units.set(a.id, a); repo.units.set(b.id, b);
    repo.routes.set("route.test", { schema: "deutschgo.route/1", id: "route.test", version: "1.0.0", status: "draft", title: "@t", summary: "@s", goals: ["general"], cefr: { from: "A0", to: "A0" }, steps: [{ unit: a.id }, { unit: b.id }] });
    return runChecks(repo).issues.filter((i) => i.code === "norm.route_rhythm");
  };
  it("measures the share of positions with the same type", () => {
    const a = a0Lesson().u;
    assert.equal(rhythmSimilarity(a, a0Lesson().u), 1);
  });
  it("reports two neighbouring lessons with the same order of types", () => {
    assert.equal(routeWith(GOOD_ORDER).length, 1);
  });
  it("accepts a neighbour whose order differs", () => {
    const other: Exercise["type"][] = [
      "number_input", "match_pairs", "spelling_input", "single_choice", "number_input", "true_false", "spelling_input", "multi_choice",
      "match_pairs", "reply_choice", "number_input", "single_choice", "spelling_input", "true_false", "multi_choice",
    ];
    assert.ok(rhythmSimilarity(a0Lesson().u, a0Lesson(other).u) <= 0.5);
    assert.equal(routeWith(other).length, 0);
  });
});
