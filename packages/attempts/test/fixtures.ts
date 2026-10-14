/** A miniature bundle: one real-shaped unit with one exercise of each type. */
import type { ContentBundle } from "@deutschgo/content-kit";

export const V2 = "concept.syntax.v2_declarative";
export const VERBS = "concept.morph.verb_present_conjugation";
export const UNIT = "unit.syntax.v2_declarative.a1";
export const UNIT_VERSION = "1.0.0";

const review = {
  linguistic: { status: "pending" as const },
  pedagogical: { status: "pending" as const },
  rights: { status: "pending" as const },
};

export function bundle(): ContentBundle {
  return {
    format: 1,
    pivot: "en",
    languages: [{ code: "en", name: "English", native_name: "English", dir: "ltr", wave: 1, ui: true, explanations: true, pivot: true }],
    coverage: [],
    l10n: {},
    routes: [],
    concepts: [
      {
        schema: "deutschgo.concept/1", id: VERBS, version: "0.1.0", status: "planned", kind: "morphology",
        domain: "verbs", title: "@title", summary: "@summary", cefr: { introduced: "A1" },
      },
      {
        schema: "deutschgo.concept/1", id: V2, version: "1.0.0", status: "needs_review", kind: "grammar",
        domain: "syntax", title: "@title", summary: "@summary", cefr: { introduced: "A1" },
        relations: [{ type: "depends_on", target: VERBS }],
        pattern: { schema_de: "X V S", scope: "@scope" },
        examples: [{ id: "e1", de: "Heute arbeite ich." }, { id: "e2", de: "Ich arbeite heute." }],
        review,
      },
    ],
    units: [
      {
        schema: "deutschgo.unit/1", id: UNIT, version: UNIT_VERSION, status: "needs_review",
        title: "@title", summary: "@summary", cefr: "A1", concepts: [V2], prerequisites: [VERBS],
        goals: ["general"], estimated_minutes: 25,
        objectives: [{ id: "obj_produce", text: "@obj", skill: "knowledge" }],
        blocks: [
          {
            type: "exercises", id: "b_practice", title: "@practice",
            items: [
              {
                id: "x_choose", type: "single_choice", objective: "obj_produce", concepts: [V2],
                prompt: "@p", difficulty: 1, explanation: "@why",
                options: [
                  { id: "a", de: "Heute ich habe frei.", correct: false, feedback: "@fb.a" },
                  { id: "b", de: "Heute habe ich frei.", correct: true },
                ],
                feedback: { correct: "@ok", incorrect: "@no" },
              },
              {
                id: "x_order", type: "word_order", objective: "obj_produce", concepts: [V2],
                prompt: "@p", difficulty: 1, explanation: "@why",
                tokens: ["ich", "nach Wien", "morgen", "fahre"], final_punctuation: ".",
                accept: ["Morgen fahre ich nach Wien.", "Ich fahre morgen nach Wien."],
                feedback: {
                  correct: "@ok", incorrect: "@no",
                  rules: [{ match: ["Morgen ich fahre nach Wien."], feedback: "@fb.v3", signals: V2 }],
                },
              },
              {
                id: "x_cloze", type: "cloze", objective: "obj_produce", concepts: [V2],
                prompt: "@p", difficulty: 2, explanation: "@why",
                text_de: "Deshalb {{0}} {{1}} Deutsch.",
                gaps: [
                  { accept: ["lerne"], rules: [{ match: ["ich"], feedback: "@fb.gap", signals: VERBS }] },
                  { accept: ["ich"] },
                ],
                feedback: { correct: "@ok", incorrect: "@no" },
              },
            ],
          },
        ],
        review,
      },
    ],
  } as ContentBundle;
}

export const T0 = Date.UTC(2026, 9, 12, 9, 0, 0);
export const iso = (ms: number) => new Date(ms).toISOString();

let n = 0;
export const uuid = () => `0000${(++n).toString().padStart(4, "0")}-0000-4000-8000-000000000000`.slice(-36);

export function request(over: Partial<import("../src/types.ts").AttemptRequest> = {}) {
  return {
    eventId: uuid(),
    unitId: UNIT,
    exerciseId: "x_order",
    contentVersion: UNIT_VERSION,
    response: { type: "word_order" as const, order: [2, 3, 0, 1] },
    occurredAt: iso(T0),
    ...over,
  };
}
