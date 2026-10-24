/**
 * Deterministic answer evaluation shared by the content validator (self-checks)
 * and the learning app. Pure functions, no dependencies.
 *
 * Normalization policy (documented in docs/domain/CONTENT_CONTRACT.md):
 * - Unicode NFC, typographic quotes/apostrophes/dashes unified.
 * - Whitespace trimmed and collapsed; spaces before , . ! ? ; : removed.
 * - Final sentence punctuation is ignored (". ! ?" at the very end).
 * - Case is significant (German nouns!), EXCEPT the first letter of the answer,
 *   which is compared case-insensitively.
 * - "ß" and "ss" are NOT treated as equal: Swiss spelling must be an explicit
 *   accepted variant in the content, so the decision stays editorial.
 */
import type {
  ClozeExercise,
  MultiChoiceExercise,
  Exercise,
  FeedbackRule,
  L10nRef,
  SingleChoiceExercise,
  TransformExercise,
  WordOrderExercise,
} from "./types.ts";

/**
 * Bumped whenever normalization or any type's evaluation semantics change.
 * Stored with every graded event so past results stay interpretable.
 */
export const EVALUATOR_VERSION = "1.0.0";

export function normalizeAnswer(input: string): string {
  let s = input.normalize("NFC");
  s = s
    .replace(/[‘’‚′`´]/g, "'")
    .replace(/[“”„«»]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/[.!?]+$/u, "")
    .trim();
  if (s.length > 0) {
    const first = s.charAt(0);
    s = first.toLocaleLowerCase("de-DE") + s.slice(1);
  }
  return s;
}

export function answersEqual(a: string, b: string): boolean {
  return normalizeAnswer(a) === normalizeAnswer(b);
}

export type Response =
  | { type: "single_choice"; optionId: string }
  | { type: "multi_choice"; optionIds: string[] }
  | { type: "word_order"; order: number[] }
  | { type: "cloze"; gaps: string[] }
  | { type: "transform"; text: string };

export interface GapResult {
  index: number;
  correct: boolean;
  feedback?: L10nRef;
  signals?: string;
}

export interface EvaluationResult {
  exerciseId: string;
  correct: boolean;
  /** 0..1; partial credit only for multi-gap cloze. */
  score: number;
  /** Primary feedback key to show. */
  feedback: L10nRef;
  /** Extra targeted feedback from matched error rules. */
  ruleFeedback?: L10nRef;
  /** Concept id signalled by a matched error rule (diagnostic evidence). */
  signals?: string;
  gaps?: GapResult[];
  /** What was compared, for transparency and debugging. */
  normalizedResponse: string;
}

export class EvaluationError extends Error {}

function matchRule(rules: FeedbackRule[] | undefined, answer: string): FeedbackRule | undefined {
  if (!rules) return undefined;
  const n = normalizeAnswer(answer);
  return rules.find((r) => r.match.some((m) => normalizeAnswer(m) === n));
}

function result(ex: Exercise, correct: boolean, normalized: string, rule?: FeedbackRule, score?: number): EvaluationResult {
  const r: EvaluationResult = {
    exerciseId: ex.id,
    correct,
    score: score ?? (correct ? 1 : 0),
    feedback: correct ? ex.feedback.correct : ex.feedback.incorrect,
    normalizedResponse: normalized,
  };
  if (rule) {
    r.ruleFeedback = rule.feedback;
    if (rule.signals) r.signals = rule.signals;
  }
  return r;
}

export function assembleWordOrder(ex: WordOrderExercise, order: number[]): string {
  if (order.length !== ex.tokens.length) {
    throw new EvaluationError(`word_order ${ex.id}: expected ${ex.tokens.length} tokens, got ${order.length}`);
  }
  const seen = new Set<number>();
  const parts = order.map((i) => {
    const t = ex.tokens[i];
    if (t === undefined || seen.has(i)) {
      throw new EvaluationError(`word_order ${ex.id}: invalid or repeated token index ${i}`);
    }
    seen.add(i);
    return t;
  });
  let sentence = parts.join(" ");
  sentence = sentence.charAt(0).toLocaleUpperCase("de-DE") + sentence.slice(1);
  return sentence + ex.final_punctuation;
}

function evalSingleChoice(ex: SingleChoiceExercise, optionId: string): EvaluationResult {
  const opt = ex.options.find((o) => o.id === optionId);
  if (!opt) throw new EvaluationError(`single_choice ${ex.id}: unknown option ${optionId}`);
  const r = result(ex, opt.correct, optionId);
  if (opt.feedback) r.ruleFeedback = opt.feedback;
  return r;
}

/**
 * Multi-choice: the learner's selection must equal the set of correct options.
 * Duplicates and unknown ids are rejected, not guessed. Scoring is all-or-nothing.
 */
function evalMultiChoice(ex: MultiChoiceExercise, optionIds: string[]): EvaluationResult {
  const known = new Set(ex.options.map((o) => o.id));
  const chosen = new Set<string>();
  for (const id of optionIds) {
    if (!known.has(id)) throw new EvaluationError(`multi_choice ${ex.id}: unknown option ${id}`);
    if (chosen.has(id)) throw new EvaluationError(`multi_choice ${ex.id}: repeated option ${id}`);
    chosen.add(id);
  }
  const correctIds = new Set(ex.options.filter((o) => o.correct).map((o) => o.id));
  const correct = correctIds.size === chosen.size && [...correctIds].every((id) => chosen.has(id));
  const normalized = [...chosen].sort().join(",");
  const r = result(ex, correct, normalized);
  if (!correct) {
    // Targeted feedback for the first wrong option the learner picked, if the author wrote one.
    const wrong = ex.options.find((o) => chosen.has(o.id) && !o.correct && o.feedback);
    if (wrong?.feedback) r.ruleFeedback = wrong.feedback;
  }
  return r;
}

function evalWordOrder(ex: WordOrderExercise, order: number[]): EvaluationResult {
  const sentence = assembleWordOrder(ex, order);
  const correct = ex.accept.some((a) => answersEqual(a, sentence));
  return result(ex, correct, normalizeAnswer(sentence), correct ? undefined : matchRule(ex.feedback.rules, sentence));
}

function evalCloze(ex: ClozeExercise, answers: string[]): EvaluationResult {
  if (answers.length !== ex.gaps.length) {
    throw new EvaluationError(`cloze ${ex.id}: expected ${ex.gaps.length} answers, got ${answers.length}`);
  }
  const gaps: GapResult[] = ex.gaps.map((gap, index) => {
    const answer = answers[index] ?? "";
    // Gap answers are words, not sentences: compare case-sensitively in full.
    const norm = answer.normalize("NFC").replace(/\s+/g, " ").trim();
    const correct = gap.accept.some((a) => a.normalize("NFC").trim() === norm);
    const g: GapResult = { index, correct };
    if (!correct) {
      const rule = gap.rules?.find((r) => r.match.some((m) => m.normalize("NFC").trim() === norm));
      if (rule) {
        g.feedback = rule.feedback;
        if (rule.signals) g.signals = rule.signals;
      }
    }
    return g;
  });
  const nCorrect = gaps.filter((g) => g.correct).length;
  const all = nCorrect === gaps.length;
  const r = result(ex, all, answers.join(" | "), undefined, gaps.length ? nCorrect / gaps.length : 0);
  r.gaps = gaps;
  const firstRule = gaps.find((g) => g.feedback);
  if (firstRule?.feedback) r.ruleFeedback = firstRule.feedback;
  if (firstRule?.signals) r.signals = firstRule.signals;
  return r;
}

function evalTransform(ex: TransformExercise, text: string): EvaluationResult {
  const correct = ex.accept.some((a) => answersEqual(a, text));
  return result(ex, correct, normalizeAnswer(text), correct ? undefined : matchRule(ex.feedback.rules, text));
}

export function evaluate(ex: Exercise, response: Response): EvaluationResult {
  if (ex.type !== response.type) {
    throw new EvaluationError(`exercise ${ex.id} is ${ex.type}, response is ${response.type}`);
  }
  switch (ex.type) {
    case "single_choice":
      return evalSingleChoice(ex, (response as Extract<Response, { type: "single_choice" }>).optionId);
    case "multi_choice":
      return evalMultiChoice(ex, (response as Extract<Response, { type: "multi_choice" }>).optionIds);
    case "word_order":
      return evalWordOrder(ex, (response as Extract<Response, { type: "word_order" }>).order);
    case "cloze":
      return evalCloze(ex, (response as Extract<Response, { type: "cloze" }>).gaps);
    case "transform":
      return evalTransform(ex, (response as Extract<Response, { type: "transform" }>).text);
  }
}

/**
 * Concepts a wrong answer signals through matched error rules (whole answer and gaps),
 * deduplicated. A correct answer signals nothing. Device and server both store these as
 * the event's `signals`, so diagnosis does not depend on where the answer was recorded.
 */
export function signalledConcepts(result: EvaluationResult): string[] {
  if (result.correct) return [];
  const all = [result.signals, ...(result.gaps ?? []).map((g) => g.signals)];
  return [...new Set(all.filter((s): s is string => !!s))];
}

/**
 * For word_order: find a token order that produces `sentence`, or undefined.
 * Used by the validator to prove each accepted sentence is buildable.
 */
export function findOrderFor(ex: WordOrderExercise, sentence: string): number[] | undefined {
  const target = normalizeAnswer(sentence);
  const n = ex.tokens.length;
  if (n > 9) return undefined; // guard: validator reports this separately
  const used = new Array<boolean>(n).fill(false);
  const order: number[] = [];
  const dfs = (): boolean => {
    if (order.length === n) return normalizeAnswer(assembleWordOrder(ex, order)) === target;
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      used[i] = true;
      order.push(i);
      if (dfs()) return true;
      order.pop();
      used[i] = false;
    }
    return false;
  };
  return dfs() ? [...order] : undefined;
}
