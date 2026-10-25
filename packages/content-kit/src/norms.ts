/**
 * Lesson norms (ADR-0023 and its 2026-10-25 amendment; standard in docs/domain/CONTENT_STANDARD.md).
 *
 * Pure functions over one unit and its pivot-language strings. They do not judge German or
 * pedagogy; they catch the structural problems the owner has reported: lessons that are too
 * short, exercises of the same kind one after another, the same question asked again with a
 * different number, and generic feedback on wrong answers.
 *
 * Norms apply to A0 units, the only level with agreed norms so far. Units in NORM_EXEMPT get
 * warnings instead of errors (see the list for the reason each one is there).
 */
import type { Block, Exercise, Unit } from "./types.ts";

export type ExerciseType = Exercise["type"];

/**
 * Estimated seconds per exercise, before feedback and retries. Not measured: calibrated so that
 * 15 exercises plus a short introduction take about 8 minutes and 25 take about 11 to 12.
 * scripts/lesson_builder.py mirrors these numbers; a drift shows up as norm.minutes_mismatch.
 */
export const EXERCISE_SECONDS: Record<ExerciseType, number> = {
  single_choice: 15,
  multi_choice: 22,
  true_false: 12,
  reply_choice: 18,
  match_pairs: 35,
  word_order: 30,
  cloze: 25,
  transform: 35,
  article_input: 15,
  form_input: 22,
  gap_fill_input: 22,
  spelling_input: 22,
  number_input: 15,
  time_input: 18,
};

/** Reading time per block, in seconds (examples and lists count per item). */
export const READING_SECONDS = {
  explanation: 30,
  pattern: 40,
  examplePerItem: 10,
  contrastPerPair: 20,
  commonErrorPerItem: 20,
  regional_note: 20,
  summary: 20,
} as const;

/** Feedback reading and retries add a fifth to exercise time. */
export const FEEDBACK_FACTOR = 1.2;

/**
 * What the learner sees: four option lists look alike to a learner even when their types
 * differ, and so do the text boxes. Used for the "no three alike in a row" rule.
 */
export const EXERCISE_SHAPE: Record<ExerciseType, "choice" | "input" | "build" | "match"> = {
  single_choice: "choice",
  multi_choice: "choice",
  true_false: "choice",
  reply_choice: "choice",
  match_pairs: "match",
  word_order: "build",
  cloze: "input",
  transform: "input",
  article_input: "input",
  form_input: "input",
  gap_fill_input: "input",
  spelling_input: "input",
  number_input: "input",
  time_input: "input",
};

export const A0_NORMS = {
  minExercises: 15,
  maxExercises: 25,
  minExamples: 5,
  minMinutes: 8,
  maxMinutes: 12,
  minTypes: 4,
  /** The same question wording (numbers and German words removed) at most this often. */
  maxSameTemplate: 2,
  /** No shape (choice, input, build, match) more than this many times in a row. */
  maxShapeRun: 2,
} as const;

/**
 * Units that keep warnings instead of errors, each with its reason. Remove an entry once the
 * unit is brought up to the norms.
 */
export const NORM_EXEMPT: ReadonlyMap<string, string> = new Map([
  ["unit.pron.alphabet_a0", "approved by the owner on 2026-10-24, before the norms; changing it needs a new owner review"],
]);

export interface NormFinding {
  code: string;
  message: string;
}

const exercisesOf = (u: Unit): Exercise[] => u.blocks.flatMap((b: Block) => (b.type === "exercises" ? b.items : []));

function readingSeconds(blocks: Block[]): number {
  let s = 0;
  for (const b of blocks) {
    switch (b.type) {
      case "explanation": s += READING_SECONDS.explanation; break;
      case "pattern": s += READING_SECONDS.pattern; break;
      case "examples": s += READING_SECONDS.examplePerItem * b.items.length; break;
      case "contrast": s += READING_SECONDS.contrastPerPair * b.pairs.length; break;
      case "common_errors": s += READING_SECONDS.commonErrorPerItem * b.items.length; break;
      case "regional_note": s += READING_SECONDS.regional_note; break;
      case "summary": s += READING_SECONDS.summary; break;
      case "exercises": break;
    }
  }
  return s;
}

/** Minutes a lesson is expected to take, from its blocks and exercise types (ADR-0023). */
export function estimateMinutes(u: Unit): number {
  const exercise = exercisesOf(u).reduce((sum, ex) => sum + (EXERCISE_SECONDS[ex.type] ?? 25), 0);
  return Math.max(1, Math.round((exercise * FEEDBACK_FACTOR + readingSeconds(u.blocks)) / 60));
}

/** German words used anywhere in the unit, lower-cased; removed from prompts to find templates. */
export function germanWords(u: Unit): Set<string> {
  const texts: string[] = [];
  for (const b of u.blocks) {
    if (b.type === "examples") for (const it of b.items) texts.push(it.de);
    if (b.type !== "exercises") continue;
    for (const ex of b.items) {
      const e = ex as unknown as Record<string, unknown>;
      for (const k of ["stem_de", "statement_de", "line_de", "text_de", "source_de"]) if (typeof e[k] === "string") texts.push(e[k] as string);
      if (Array.isArray(e.accept)) texts.push(...(e.accept as string[]));
      if (Array.isArray(e.tokens)) texts.push(...(e.tokens as string[]));
      if (Array.isArray(e.options)) for (const o of e.options as { de?: string }[]) if (o.de) texts.push(o.de);
      if (Array.isArray(e.pairs)) for (const p of e.pairs as { left_de: string; right_de: string }[]) texts.push(p.left_de, p.right_de);
      if (Array.isArray(e.gaps)) for (const g of e.gaps as { accept: string[] }[]) texts.push(...g.accept);
    }
  }
  const words = new Set<string>();
  for (const t of texts) for (const w of t.toLowerCase().split(/[^\p{L}]+/u)) if (w.length >= 2) words.add(w);
  return words;
}

/**
 * The wording of a prompt with its variable parts removed: quoted text, numbers, and German
 * words from the lesson. "Which word means 30?" and "Which word means 40?" share a template.
 */
export function promptTemplate(prompt: string, german: Set<string>): string {
  const unquoted = prompt
    .replace(/„[^“”"]*[“”"]/g, " q ")
    .replace(/“[^”]*”/g, " q ")
    .replace(/«[^»]*»/g, " q ")
    .replace(/"[^"]*"/g, " q ")
    .replace(/‘[^’]*’/g, " q ")
    .toLowerCase()
    .replace(/\d+/g, " # ");
  return unquoted
    .split(/[^\p{L}#]+/u)
    .filter((w) => w && !german.has(w))
    .join(" ");
}

/** Every norm the unit misses. `strings` are the pivot-language strings of the unit, if present. */
export function lessonNorms(u: Unit, strings: Record<string, string> | undefined): NormFinding[] {
  const out: NormFinding[] = [];
  if (u.cefr !== "A0") return out;
  const n = A0_NORMS;
  const exs = exercisesOf(u);

  if (exs.length < n.minExercises || exs.length > n.maxExercises) {
    out.push({ code: "norm.exercise_count", message: `${exs.length} exercises; an A0 lesson has ${n.minExercises}–${n.maxExercises}` });
  }

  const examples = u.blocks.reduce((sum, b) => sum + (b.type === "examples" ? b.items.length : 0), 0);
  if (examples < n.minExamples) out.push({ code: "norm.examples", message: `${examples} examples; an A0 lesson shows at least ${n.minExamples} new words in examples` });

  const minutes = estimateMinutes(u);
  if (minutes < n.minMinutes || minutes > n.maxMinutes) out.push({ code: "norm.minutes_range", message: `estimated ${minutes} min; an A0 lesson takes ${n.minMinutes}–${n.maxMinutes} min` });
  if (Math.abs(u.estimated_minutes - minutes) > 1) out.push({ code: "norm.minutes_mismatch", message: `estimated_minutes is ${u.estimated_minutes}, the norm formula gives ${minutes}` });

  const types = new Map<ExerciseType, number>();
  for (const ex of exs) types.set(ex.type, (types.get(ex.type) ?? 0) + 1);
  if (exs.length > 0 && types.size < n.minTypes) out.push({ code: "norm.type_variety", message: `${types.size} exercise types; use at least ${n.minTypes}` });

  const maxShare = Math.ceil(exs.length / 4);
  for (const [t, count] of types) {
    if (count > maxShare) out.push({ code: "norm.type_share", message: `${t} is used ${count} times; at most ${maxShare} in a lesson of ${exs.length}` });
  }

  for (let i = 1; i < exs.length; i++) {
    if (exs[i]!.type === exs[i - 1]!.type) out.push({ code: "norm.adjacent_type", message: `${exs[i - 1]!.id} and ${exs[i]!.id} are both ${exs[i]!.type}; never put two of a type next to each other` });
  }

  let run = 1;
  for (let i = 1; i < exs.length; i++) {
    run = EXERCISE_SHAPE[exs[i]!.type] === EXERCISE_SHAPE[exs[i - 1]!.type] ? run + 1 : 1;
    if (run === n.maxShapeRun + 1) out.push({ code: "norm.shape_run", message: `${n.maxShapeRun + 1} ${EXERCISE_SHAPE[exs[i]!.type]} exercises in a row, ending at ${exs[i]!.id}` });
  }

  if (strings) {
    const german = germanWords(u);
    const byTemplate = new Map<string, string[]>();
    for (const ex of exs) {
      const text = strings[ex.prompt.replace(/^@/, "")];
      if (!text) continue;
      const t = promptTemplate(text, german);
      byTemplate.set(t, [...(byTemplate.get(t) ?? []), ex.id]);
    }
    for (const [t, ids] of byTemplate) {
      if (ids.length > n.maxSameTemplate) out.push({ code: "norm.prompt_template", message: `${ids.length} exercises (${ids.join(", ")}) ask the same question "${t}"; at most ${n.maxSameTemplate}` });
    }
  }

  // Wrong answers get their own explanation: one feedback text shared by several distractors is generic.
  const feedbackUse = new Map<string, number>();
  for (const ex of exs) {
    if (ex.type === "single_choice" || ex.type === "multi_choice" || ex.type === "reply_choice") {
      for (const o of ex.options) {
        if (o.correct) continue;
        if (!o.feedback) out.push({ code: "norm.distractor_feedback", message: `${ex.id}: option ${o.id} has no feedback` });
        else feedbackUse.set(o.feedback, (feedbackUse.get(o.feedback) ?? 0) + 1);
      }
    }
    if (ex.type === "true_false" && !ex.wrong_feedback) out.push({ code: "norm.distractor_feedback", message: `${ex.id}: true_false needs wrong_feedback` });
  }
  for (const [key, count] of feedbackUse) {
    if (count > 1) out.push({ code: "norm.generic_feedback", message: `feedback ${key} is shared by ${count} wrong options; each wrong option explains its own mistake` });
  }
  return out;
}

/**
 * Share of positions at which two lessons use the same exercise type (0..1), over the shorter
 * lesson. Two lessons in a row with the same rhythm feel like the same lesson again.
 */
export function rhythmSimilarity(a: Unit, b: Unit): number {
  const x = exercisesOf(a).map((e) => e.type);
  const y = exercisesOf(b).map((e) => e.type);
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;
  let same = 0;
  for (let i = 0; i < n; i++) if (x[i] === y[i]) same++;
  return same / n;
}

/** Neighbouring A0 lessons on a route may share the type at no more than this share of positions. */
export const MAX_RHYTHM_SIMILARITY = 0.5;

/** Units whose pivot titles are identical; one subtopic per lesson means one title per lesson. */
export function duplicateTitles(titles: Map<string, string>): string[][] {
  const byTitle = new Map<string, string[]>();
  for (const [id, t] of titles) {
    const k = t.trim().toLowerCase();
    byTitle.set(k, [...(byTitle.get(k) ?? []), id]);
  }
  return [...byTitle.values()].filter((ids) => ids.length > 1);
}
