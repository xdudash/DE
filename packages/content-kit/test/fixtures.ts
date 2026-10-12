/** In-memory fixtures for dependency-free unit tests. */
import type { Concept, ContentRepo, Localization, Unit, WordOrderExercise } from "../src/types.ts";

export const review = {
  linguistic: { status: "pending" as const },
  pedagogical: { status: "pending" as const },
  rights: { status: "pending" as const },
};

export function concept(id: string, extra: Partial<Concept> = {}): Concept {
  return { schema: "deutschgo.concept/1", id, version: "1.0.0", status: "planned", kind: "grammar", domain: "syntax", title: "@title", summary: "@summary", cefr: { introduced: "A1" }, ...extra };
}

export const wordOrder: WordOrderExercise = {
  id: "x1",
  type: "word_order",
  objective: "o1",
  concepts: ["concept.syntax.v2"],
  prompt: "@p",
  difficulty: 1,
  tokens: ["ich", "nach Wien", "morgen", "fahre"],
  final_punctuation: ".",
  accept: ["Morgen fahre ich nach Wien.", "Ich fahre morgen nach Wien."],
  feedback: { correct: "@ok", incorrect: "@no", rules: [{ match: ["Morgen ich fahre nach Wien."], feedback: "@v3", signals: "concept.syntax.v2" }] },
  explanation: "@why",
};

export function unit(extra: Partial<Unit> = {}): Unit {
  return {
    schema: "deutschgo.unit/1", id: "unit.syntax.v2.a1", version: "1.0.0", status: "draft",
    title: "@title", summary: "@summary", cefr: "A1",
    concepts: ["concept.syntax.v2"], prerequisites: [], goals: ["general"], estimated_minutes: 10,
    objectives: [{ id: "o1", text: "@o1", skill: "knowledge" }],
    blocks: [{ type: "exercises", id: "b1", title: "@b1", items: [structuredClone(wordOrder)] }],
    review, ...extra,
  };
}

const unitKeys = ["title", "summary", "o1", "b1", "p", "ok", "no", "v3", "why"];

export function l10n(entity: string, lang: string, keys: string[], version = "1.0.0"): Localization {
  return { schema: "deutschgo.l10n/1", entity, lang, based_on_version: version, status: "draft", strings: Object.fromEntries(keys.map((k) => [k, `${lang}:${k}`])) };
}

export function validRepo(): ContentRepo {
  const v2 = concept("concept.syntax.v2", {
    status: "draft",
    pattern: { schema_de: "X V S", scope: "@scope" },
    examples: [{ id: "e1", de: "Heute arbeite ich." }, { id: "e2", de: "Ich arbeite heute." }],
    review,
  });
  const repo: ContentRepo = {
    root: "/fixture",
    concepts: new Map([[v2.id, v2]]),
    units: new Map(),
    routes: new Map(),
    l10n: new Map(),
    languages: { schema: "deutschgo.languages/1", languages: [
      { code: "en", name: "English", native_name: "English", dir: "ltr", wave: 1, ui: true, explanations: true, pivot: true },
      { code: "ru", name: "Russian", native_name: "Русский", dir: "ltr", wave: 1, ui: true, explanations: true },
    ] },
    sources: { schema: "deutschgo.sources/1", sources: [] },
    files: new Map(),
  };
  const u = unit();
  repo.units.set(u.id, u);
  for (const lang of ["en", "ru"]) {
    repo.l10n.set(`${lang}:concept.syntax.v2`, l10n("concept.syntax.v2", lang, ["title", "summary", "scope"]));
    repo.l10n.set(`${lang}:${u.id}`, l10n(u.id, lang, unitKeys));
  }
  return repo;
}
