/**
 * Semantic (cross-file) checks that JSON Schema cannot express.
 * Input: an already schema-validated ContentRepo. Pure; no I/O.
 */
import { answersEqual, evaluate, findOrderFor, normalizeAnswer } from "./evaluate.ts";
import { findPrerequisiteCycles, prerequisitesOf } from "./graph.ts";
import { collectKeys } from "./l10n.ts";
import type { Block, ContentRepo, Exercise, Issue, Review, Route, Unit } from "./types.ts";

const ID_PREFIX = { concept: "concept.", unit: "unit.", route: "route." } as const;

class Collector {
  issues: Issue[] = [];
  private repo: ContentRepo;
  constructor(repo: ContentRepo) {
    this.repo = repo;
  }
  add(severity: Issue["severity"], code: string, entity: string | undefined, message: string): void {
    const file = entity ? this.repo.files.get(entity) : undefined;
    const issue: Issue = { severity, code, message };
    if (entity) issue.entity = entity;
    if (file) issue.file = file;
    this.issues.push(issue);
  }
  error(code: string, entity: string | undefined, msg: string): void { this.add("error", code, entity, msg); }
  warn(code: string, entity: string | undefined, msg: string): void { this.add("warning", code, entity, msg); }
}

function reviewIsComplete(r: Review | undefined): boolean {
  if (!r) return false;
  const ok = (s: string) => s === "passed" || s === "not_applicable";
  return ok(r.linguistic.status) && ok(r.pedagogical.status) && ok(r.rights.status);
}

export function unitExercises(u: Unit): Exercise[] {
  return u.blocks.flatMap((b: Block) => (b.type === "exercises" ? b.items : []));
}

function checkIds(c: Collector, repo: ContentRepo): void {
  for (const [id] of repo.concepts) if (!id.startsWith(ID_PREFIX.concept)) c.error("id.prefix", id, `concept id must start with "${ID_PREFIX.concept}"`);
  for (const [id] of repo.units) if (!id.startsWith(ID_PREFIX.unit)) c.error("id.prefix", id, `unit id must start with "${ID_PREFIX.unit}"`);
  for (const [id] of repo.routes) if (!id.startsWith(ID_PREFIX.route)) c.error("id.prefix", id, `route id must start with "${ID_PREFIX.route}"`);

  for (const u of repo.units.values()) {
    const seen = new Set<string>();
    const dup = (x: string) => {
      if (seen.has(x)) c.error("id.duplicate_local", u.id, `local id "${x}" is used more than once`);
      seen.add(x);
    };
    u.objectives.forEach((o) => dup(o.id));
    for (const b of u.blocks) {
      dup(b.id);
      if (b.type === "examples") b.items.forEach((e) => dup(e.id));
      if (b.type === "contrast") b.pairs.forEach((p) => { dup(p.id); dup(p.a.id); dup(p.b.id); });
      if (b.type === "common_errors") b.items.forEach((e) => dup(e.id));
      if (b.type === "exercises") b.items.forEach((e) => dup(e.id));
    }
  }
  for (const k of repo.concepts.values()) {
    const seen = new Set<string>();
    for (const x of [...(k.examples ?? []).map((e) => e.id), ...(k.confusions ?? []).map((e) => e.id)]) {
      if (seen.has(x)) c.error("id.duplicate_local", k.id, `local id "${x}" is used more than once`);
      seen.add(x);
    }
  }
}

function checkReferences(c: Collector, repo: ContentRepo): void {
  const sourceIds = new Set(repo.sources.sources.map((s) => s.id));
  const checkSources = (entity: string, list: { source: string }[] | undefined) => {
    for (const s of list ?? []) {
      if (!sourceIds.has(s.source)) c.error("ref.source", entity, `unknown source "${s.source}"`);
      else {
        const src = repo.sources.sources.find((x) => x.id === s.source)!;
        if (src.status !== "approved") c.error("rights.source_not_approved", entity, `source "${s.source}" is ${src.status}; only approved sources may be used in content`);
      }
    }
  };

  for (const k of repo.concepts.values()) {
    for (const r of k.relations ?? []) {
      const t = repo.concepts.get(r.target);
      if (!t) c.error("ref.concept", k.id, `relation ${r.type} -> unknown concept "${r.target}"`);
      else if (t.id === k.id) c.error("ref.self", k.id, `relation ${r.type} points to itself`);
      else if (t.status === "deprecated") c.warn("ref.deprecated", k.id, `relation -> deprecated concept "${r.target}"`);
    }
    checkSources(k.id, k.sources);
    for (const e of k.examples ?? []) if (e.source) checkSources(k.id, [{ source: e.source }]);
  }

  for (const u of repo.units.values()) {
    for (const id of [...u.concepts, ...u.prerequisites]) {
      if (!repo.concepts.has(id)) c.error("ref.concept", u.id, `unknown concept "${id}"`);
    }
    for (const id of u.concepts) {
      const k = repo.concepts.get(id);
      if (k?.status === "planned") c.error("status.planned_taught", u.id, `unit teaches planned concept "${id}"; author the concept first (status >= draft)`);
    }
    // Every direct prerequisite of a taught concept should be declared or taught.
    const declared = new Set([...u.concepts, ...u.prerequisites]);
    for (const id of u.concepts) {
      const k = repo.concepts.get(id);
      for (const p of k ? prerequisitesOf(k) : []) {
        if (!declared.has(p)) c.warn("unit.undeclared_prerequisite", u.id, `concept "${id}" depends_on "${p}", which the unit neither teaches nor lists in prerequisites`);
      }
    }
    const objectives = new Set(u.objectives.map((o) => o.id));
    for (const ex of unitExercises(u)) {
      if (!objectives.has(ex.objective)) c.error("ref.objective", u.id, `exercise ${ex.id}: unknown objective "${ex.objective}"`);
      for (const id of ex.concepts) if (!repo.concepts.has(id)) c.error("ref.concept", u.id, `exercise ${ex.id}: unknown concept "${id}"`);
      const signals = [
        ...(ex.feedback.rules ?? []).map((r) => r.signals),
        ...(ex.type === "cloze" ? ex.gaps.flatMap((g) => (g.rules ?? []).map((r) => r.signals)) : []),
      ].filter((x): x is string => !!x);
      for (const s of signals) if (!repo.concepts.has(s)) c.error("ref.concept", u.id, `exercise ${ex.id}: rule signals unknown concept "${s}"`);
    }
    const usedObjectives = new Set(unitExercises(u).map((e) => e.objective));
    for (const o of u.objectives) if (!usedObjectives.has(o.id)) c.warn("unit.untested_objective", u.id, `objective "${o.id}" has no exercise`);
    checkSources(u.id, u.sources);
    for (const b of u.blocks) {
      const exs = b.type === "examples" ? b.items : b.type === "contrast" ? b.pairs.flatMap((p) => [p.a, p.b]) : [];
      for (const e of exs) if (e.source) checkSources(u.id, [{ source: e.source }]);
    }
  }

  for (const r of repo.routes.values()) {
    checkRouteOrder(c, repo, r);
    r.steps.forEach((s, i) => {
      if (!!s.unit === !!s.concept) c.error("route.step", r.id, `step ${i}: exactly one of unit/concept is required`);
      if (s.unit && !repo.units.has(s.unit)) c.error("ref.unit", r.id, `step ${i}: unknown unit "${s.unit}"`);
      if (s.concept && !repo.concepts.has(s.concept)) c.error("ref.concept", r.id, `step ${i}: unknown concept "${s.concept}"`);
    });
  }
}

/**
 * A route is a recommendation, so it may not lock anything — but a step whose
 * prerequisites appear later (or nowhere) teaches in an order the learner cannot
 * follow. Reported as a warning: a route may deliberately assume prior knowledge.
 */
function checkRouteOrder(c: Collector, repo: ContentRepo, route: Route): void {
  const covered = new Set<string>();
  route.steps.forEach((step, i) => {
    const taught = step.unit ? (repo.units.get(step.unit)?.concepts ?? []) : step.concept ? [step.concept] : [];
    const assumed = step.unit ? (repo.units.get(step.unit)?.prerequisites ?? []) : [];
    for (const id of taught) {
      const concept = repo.concepts.get(id);
      for (const p of concept ? prerequisitesOf(concept) : []) {
        if (covered.has(p) || assumed.includes(p)) continue;
        const later = route.steps.some((s2, j) => j > i && (s2.concept === p || (s2.unit && repo.units.get(s2.unit)?.concepts.includes(p))));
        c.warn("route.prerequisite_order", route.id, later
          ? `step ${i} (${step.unit ?? step.concept}) needs "${p}", which the route teaches later`
          : `step ${i} (${step.unit ?? step.concept}) needs "${p}", which the route never covers`);
      }
    }
    for (const id of [...taught, ...assumed]) covered.add(id);
  });
}

function checkStatuses(c: Collector, repo: ContentRepo): void {
  const all = [...repo.concepts.values(), ...repo.units.values()];
  for (const e of all) {
    if ((e.status === "approved" || e.status === "published") && !reviewIsComplete(e.review)) {
      c.error("status.unreviewed_approved", e.id, `status "${e.status}" requires linguistic, pedagogical and rights review to be passed`);
    }
    if (e.status !== "planned" && e.schema === "deutschgo.concept/1" && !e.review) {
      c.error("status.review_missing", e.id, "non-planned concepts must carry a review record");
    }
  }
  for (const u of repo.units.values()) {
    if (u.status === "published") {
      for (const id of u.concepts) {
        const k = repo.concepts.get(id);
        if (k && k.status !== "published" && k.status !== "approved") c.error("status.publish_dependency", u.id, `published unit teaches non-approved concept "${id}"`);
      }
    }
  }
}

function checkExercises(c: Collector, repo: ContentRepo): void {
  for (const u of repo.units.values()) {
    for (const ex of unitExercises(u)) {
      const where = `exercise ${ex.id}`;
      try {
        switch (ex.type) {
          case "flashcard_recall": {
            if (!ex.front || !ex.back_de.trim()) c.error("exercise.flashcard_content", u.id, `${where}: recall cards need a front and a German answer`);
            if (ex.example_de !== undefined && !ex.example_de.trim()) c.error("exercise.flashcard_example", u.id, `${where}: example sentence must not be empty`);
            break;
          }
          case "odd_one_out": {
            const correct = ex.options.filter((option) => option.correct);
            if (ex.options.length < 3) c.error("exercise.odd_one_out_count", u.id, `${where}: provide at least three items for comparison`);
            if (correct.length !== 1) c.error("exercise.choice_correct_count", u.id, `${where}: exactly one item must be the odd one out`);
            const ids = new Set<string>();
            for (const option of ex.options) {
              if (ids.has(option.id)) c.error("exercise.option_id", u.id, `${where}: duplicate option id ${option.id}`);
              ids.add(option.id);
              if (!option.de.trim()) c.error("exercise.option_empty", u.id, `${where}: item ${option.id} is empty`);
              if (!option.correct && !option.feedback) c.warn("exercise.distractor_feedback", u.id, `${where}: item ${option.id} has no targeted feedback`);
            }
            if (correct[0] && !evaluate(ex, { type: "odd_one_out", optionId: correct[0].id }).correct) c.error("exercise.self_check", u.id, `${where}: odd item does not evaluate as correct`);
            break;
          }
          case "single_choice": {
            const n = ex.options.filter((o) => o.correct).length;
            if (n !== 1) c.error("exercise.choice_correct_count", u.id, `${where}: exactly one correct option required, found ${n}`);
            const ids = new Set<string>();
            for (const o of ex.options) {
              if (ids.has(o.id)) c.error("exercise.option_id", u.id, `${where}: duplicate option id ${o.id}`);
              ids.add(o.id);
              if (!o.de && !o.text) c.error("exercise.option_empty", u.id, `${where}: option ${o.id} needs "de" or "text"`);
              if (!o.correct && !o.feedback) c.warn("exercise.distractor_feedback", u.id, `${where}: distractor ${o.id} has no targeted feedback`);
            }
            const correct = ex.options.find((o) => o.correct);
            if (correct && !evaluate(ex, { type: "single_choice", optionId: correct.id }).correct) c.error("exercise.self_check", u.id, `${where}: correct option does not evaluate as correct`);
            break;
          }
          case "true_false": {
            if (!ex.statement_de.trim()) c.error("exercise.empty_statement", u.id, `${where}: statement_de is empty`);
            break;
          }
          case "match_pairs": {
            const lefts = new Set(ex.pairs.map((p) => p.id));
            const rights = new Set(ex.pairs.map((p) => p.right_de));
            if (lefts.size !== ex.pairs.length) c.error("exercise.option_id", u.id, `${where}: duplicate pair id`);
            if (rights.size !== ex.pairs.length) c.error("exercise.match_rights", u.id, `${where}: two pairs share the same right side`);
            const all: Record<string, string> = {};
            for (const p of ex.pairs) all[p.id] = p.id;
            if (!evaluate(ex, { type: "match_pairs", matches: all }).correct) c.error("exercise.self_check", u.id, `${where}: the correct pairing does not evaluate as correct`);
            break;
          }
          case "categorize": {
            const categoryIds = new Set(ex.categories.map((category) => category.id));
            const itemIds = new Set(ex.items.map((item) => item.id));
            if (categoryIds.size !== ex.categories.length) c.error("exercise.category_id", u.id, `${where}: duplicate category id`);
            if (itemIds.size !== ex.items.length) c.error("exercise.item_id", u.id, `${where}: duplicate item id`);
            for (const item of ex.items) if (!categoryIds.has(item.categoryId)) c.error("exercise.category_ref", u.id, `${where}: item ${item.id} uses unknown category ${item.categoryId}`);
            for (const category of ex.categories) if (!ex.items.some((item) => item.categoryId === category.id)) c.error("exercise.category_empty", u.id, `${where}: category ${category.id} has no items`);
            const assignments = Object.fromEntries(ex.items.map((item) => [item.id, item.categoryId]));
            if (!evaluate(ex, { type: "categorize", assignments }).correct) c.error("exercise.self_check", u.id, `${where}: the authored categories do not evaluate as correct`);
            break;
          }
          case "reply_choice": {
            const n = ex.options.filter((o) => o.correct).length;
            if (n !== 1) c.error("exercise.choice_correct_count", u.id, `${where}: exactly one correct reply required, found ${n}`);
            const correct = ex.options.find((o) => o.correct);
            if (correct && !evaluate(ex, { type: "reply_choice", optionId: correct.id }).correct) c.error("exercise.self_check", u.id, `${where}: correct reply does not evaluate as correct`);
            break;
          }
          case "listening_choice": {
            const n = ex.options.filter((o) => o.correct).length;
            if (n !== 1) c.error("exercise.choice_correct_count", u.id, `${where}: exactly one correct listening option required, found ${n}`);
            const ids = new Set<string>();
            for (const option of ex.options) {
              if (ids.has(option.id)) c.error("exercise.option_id", u.id, `${where}: duplicate option id ${option.id}`);
              ids.add(option.id);
              if (!option.de && !option.text) c.error("exercise.option_empty", u.id, `${where}: option ${option.id} needs "de" or "text"`);
            }
            const correct = ex.options.find((option) => option.correct);
            if (correct && !evaluate(ex, { type: "listening_choice", optionId: correct.id }).correct) c.error("exercise.self_check", u.id, `${where}: correct listening option does not evaluate as correct`);
            break;
          }
          case "minimal_pairs": {
            const correctOptions = ex.options.filter((option) => option.correct);
            if (correctOptions.length !== 1) c.error("exercise.choice_correct_count", u.id, `${where}: exactly one correct minimal-pair option required, found ${correctOptions.length}`);
            const ids = new Set<string>();
            const words = new Set<string>();
            for (const option of ex.options) {
              if (ids.has(option.id)) c.error("exercise.option_id", u.id, `${where}: duplicate option id ${option.id}`);
              ids.add(option.id);
              if (words.has(option.de.toLocaleLowerCase("de-DE"))) c.error("exercise.minimal_pair_duplicate", u.id, `${where}: duplicate pronunciation option ${option.de}`);
              words.add(option.de.toLocaleLowerCase("de-DE"));
            }
            if (!ex.audio_text_de.trim()) c.error("exercise.empty_audio", u.id, `${where}: audio_text_de is empty`);
            const correct = correctOptions[0];
            if (correct && !answersEqual(correct.de, ex.audio_text_de)) c.error("exercise.minimal_pair_target", u.id, `${where}: correct spelling must match the spoken target`);
            if (correct && !evaluate(ex, { type: "minimal_pairs", optionId: correct.id }).correct) c.error("exercise.self_check", u.id, `${where}: target option does not evaluate as correct`);
            break;
          }
          case "dictation": {
            if (!ex.audio_text_de.trim()) c.error("exercise.empty_audio", u.id, `${where}: audio_text_de is empty`);
            if (!ex.accept.length || ex.accept.some((answer) => !answer.trim())) c.error("exercise.empty_accept", u.id, `${where}: at least one non-empty accepted answer is required`);
            if (ex.accept[0] && !evaluate(ex, { type: "dictation", text: ex.accept[0] }).correct) c.error("exercise.self_check", u.id, `${where}: authored dictation answer does not evaluate as correct`);
            break;
          }
          case "error_correction": {
            if (!ex.source_de.trim()) c.error("exercise.empty_source", u.id, `${where}: source_de is empty`);
            if (!ex.accept.length || ex.accept.some((answer) => !answer.trim())) c.error("exercise.empty_accept", u.id, `${where}: at least one non-empty correction is required`);
            if (ex.source_de.trim() && evaluate(ex, { type: "error_correction", text: ex.source_de }).correct) c.error("exercise.source_is_answer", u.id, `${where}: source_de is already an accepted correction`);
            if (ex.accept[0] && !evaluate(ex, { type: "error_correction", text: ex.accept[0] }).correct) c.error("exercise.self_check", u.id, `${where}: authored correction does not evaluate as correct`);
            break;
          }
          case "article_input":
          case "form_input":
          case "gap_fill_input":
          case "spelling_input":
          case "number_input":
          case "time_input": {
            if (ex.accept.length < 1) c.error("exercise.accept_empty", u.id, `${where}: accept list is empty`);
            for (const a of ex.accept) if (!evaluate(ex, { type: ex.type, text: a }).correct) c.error("exercise.self_check", u.id, `${where}: accepted "${a}" does not evaluate as correct`);
            break;
          }
          case "multi_choice": {
            const nCorrect = ex.options.filter((o) => o.correct).length;
            const nWrong = ex.options.length - nCorrect;
            if (nCorrect < 1 || nWrong < 1) c.error("exercise.multi_correct_count", u.id, `${where}: needs at least one correct and one incorrect option, found ${nCorrect} correct`);
            const ids = new Set<string>();
            for (const o of ex.options) {
              if (ids.has(o.id)) c.error("exercise.option_id", u.id, `${where}: duplicate option id ${o.id}`);
              ids.add(o.id);
              if (!o.de && !o.text) c.error("exercise.option_empty", u.id, `${where}: option ${o.id} needs "de" or "text"`);
              if (!o.correct && !o.feedback) c.warn("exercise.distractor_feedback", u.id, `${where}: distractor ${o.id} has no targeted feedback`);
            }
            const correctIds = ex.options.filter((o) => o.correct).map((o) => o.id);
            if (correctIds.length > 0 && !evaluate(ex, { type: "multi_choice", optionIds: correctIds }).correct) c.error("exercise.self_check", u.id, `${where}: the correct set does not evaluate as correct`);
            break;
          }
          case "keyword_build": {
            if (ex.keywords.length < 2) c.error("exercise.keyword_count", u.id, `${where}: at least two keywords are required`);
            const keywords = new Set(ex.keywords.map(normalizeAnswer));
            if (keywords.size !== ex.keywords.length) c.error("exercise.keyword_duplicate", u.id, `${where}: keywords must be unique`);
            for (const answer of ex.accept) {
              if (!evaluate(ex, { type: "keyword_build", text: answer }).correct) c.error("exercise.self_check", u.id, `${where}: accepted answer does not evaluate as correct`);
              const normalized = normalizeAnswer(answer);
              for (const keyword of ex.keywords) if (!normalized.includes(normalizeAnswer(keyword))) c.error("exercise.keyword_missing", u.id, `${where}: accepted answer "${answer}" does not use keyword "${keyword}"`);
            }
            break;
          }
          case "token_bank_build": {
            if (ex.tokens.length < 2 || ex.tokens.length > 12) c.error("exercise.token_count", u.id, `${where}: use 2 to 12 word-bank tokens`);
            if (ex.solutions.length === 0) c.error("exercise.solution_count", u.id, `${where}: at least one solution is required`);
            const seenSolutions = new Set<string>();
            for (const solution of ex.solutions) {
              if (solution.length === 0 || solution.length > ex.tokens.length) {
                c.error("exercise.solution_length", u.id, `${where}: each solution must use one or more available tokens`);
                continue;
              }
              if (solution.some((index) => !Number.isInteger(index) || index < 0 || index >= ex.tokens.length)
                || new Set(solution).size !== solution.length) {
                c.error("exercise.solution_indices", u.id, `${where}: solution indices must be unique valid token positions`);
                continue;
              }
              const answer = evaluate(ex, { type: "token_bank_build", order: solution });
              if (!answer.correct) c.error("exercise.self_check", u.id, `${where}: authored solution does not evaluate as correct`);
              const normalized = normalizeAnswer(answer.normalizedResponse);
              if (seenSolutions.has(normalized)) c.error("exercise.duplicate_solution", u.id, `${where}: solutions must produce distinct sentences`);
              seenSolutions.add(normalized);
            }
            const identity = ex.tokens.map((_, index) => index);
            if (evaluate(ex, { type: "token_bank_build", order: identity }).correct) c.warn("exercise.reveals_answer", u.id, `${where}: the full word bank is already a correct sentence`);
            break;
          }
          case "verb_position": {
            if (ex.tokens.length < 2 || ex.tokens.length > 15) c.error("exercise.verb_position_tokens", u.id, `${where}: use 2 to 15 sentence chunks`);
            if (!Number.isInteger(ex.finite_verb_index) || ex.finite_verb_index < 0 || ex.finite_verb_index >= ex.tokens.length) {
              c.error("exercise.verb_position_index", u.id, `${where}: finite_verb_index must identify a sentence chunk`);
            } else if (!evaluate(ex, { type: "verb_position", tokenIndex: ex.finite_verb_index }).correct) {
              c.error("exercise.self_check", u.id, `${where}: marked finite verb does not evaluate as correct`);
            }
            break;
          }
          case "word_order": {
            if (ex.tokens.length > 9) c.error("exercise.too_many_tokens", u.id, `${where}: at most 9 tokens supported`);
            for (const a of ex.accept) {
              const order = findOrderFor(ex, a);
              if (!order) c.error("exercise.unbuildable_answer", u.id, `${where}: accepted answer "${a}" cannot be built from the tokens`);
              else if (!evaluate(ex, { type: "word_order", order }).correct) c.error("exercise.self_check", u.id, `${where}: accepted answer "${a}" does not evaluate as correct`);
            }
            const identity = ex.tokens.map((_, i) => i);
            if (evaluate(ex, { type: "word_order", order: identity }).correct) c.warn("exercise.reveals_answer", u.id, `${where}: tokens are already presented in a correct order`);
            for (const r of ex.feedback.rules ?? []) {
              for (const m of r.match) {
                if (ex.accept.some((a) => answersEqual(a, m))) c.error("exercise.rule_shadows_answer", u.id, `${where}: error rule matches an accepted answer "${m}"`);
                if (!findOrderFor(ex, m)) c.warn("exercise.unreachable_rule", u.id, `${where}: error rule "${m}" cannot be produced from the tokens`);
              }
            }
            break;
          }
          case "cloze": {
            const found = [...ex.text_de.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
            const expected = ex.gaps.map((_, i) => i);
            if (found.length !== expected.length || found.some((v, i) => v !== expected[i])) {
              c.error("exercise.cloze_gaps", u.id, `${where}: placeholders ${JSON.stringify(found)} must be {{0}}..{{${ex.gaps.length - 1}}} in order`);
            }
            ex.gaps.forEach((g, i) => {
              for (const r of g.rules ?? []) for (const m of r.match) if (g.accept.includes(m)) c.error("exercise.rule_shadows_answer", u.id, `${where}: gap ${i} rule matches accepted "${m}"`);
            });
            const firstAccepted = ex.gaps.map((g) => g.accept[0] ?? "");
            if (!evaluate(ex, { type: "cloze", gaps: firstAccepted }).correct) c.error("exercise.self_check", u.id, `${where}: accepted answers do not evaluate as correct`);
            break;
          }
          case "separable_verb": {
            for (const answer of ex.accept) {
              if (!evaluate(ex, { type: "separable_verb", text: answer }).correct) c.error("exercise.self_check", u.id, `${where}: accepted sentence "${answer}" does not evaluate as correct`);
              const words = new Set(normalizeAnswer(answer).split(" "));
              if (!words.has(normalizeAnswer(ex.finite_form_de)) || !words.has(normalizeAnswer(ex.prefix_de))) c.error("exercise.separable_parts_missing", u.id, `${where}: accepted sentence "${answer}" must include the finite form and separated prefix`);
            }
            if (ex.accept.some((answer) => answersEqual(answer, ex.source_de))) c.warn("exercise.reveals_answer", u.id, `${where}: source sentence is already an accepted answer`);
            break;
          }
          case "transform": {
            for (const a of ex.accept) if (!evaluate(ex, { type: "transform", text: a }).correct) c.error("exercise.self_check", u.id, `${where}: accepted "${a}" does not evaluate as correct`);
            if (ex.accept.some((a) => answersEqual(a, ex.source_de))) c.warn("exercise.reveals_answer", u.id, `${where}: source sentence is already an accepted answer`);
            for (const r of ex.feedback.rules ?? []) for (const m of r.match) if (ex.accept.some((a) => answersEqual(a, m))) c.error("exercise.rule_shadows_answer", u.id, `${where}: error rule matches accepted "${m}"`);
            break;
          }
          case "modal_choice": {
            const correct = ex.options.filter((option) => option.correct);
            if (ex.options.length < 2) c.error("exercise.choice_count", u.id, `${where}: at least two modal forms are required`);
            if (correct.length !== 1) c.error("exercise.choice_correct_count", u.id, `${where}: exactly one modal form must be correct`);
            const ids = new Set<string>();
            for (const option of ex.options) {
              if (ids.has(option.id)) c.error("exercise.option_id", u.id, `${where}: duplicate option id ${option.id}`);
              ids.add(option.id);
              if (!option.de.trim()) c.error("exercise.option_empty", u.id, `${where}: modal option ${option.id} is empty`);
              if (!option.correct && !option.feedback) c.warn("exercise.distractor_feedback", u.id, `${where}: modal distractor ${option.id} has no targeted feedback`);
            }
            if (correct[0] && !evaluate(ex, { type: "modal_choice", optionId: correct[0].id }).correct) c.error("exercise.self_check", u.id, `${where}: correct modal form does not evaluate as correct`);
            break;
          }
          case "dialogue_gap": {
            const gaps = ex.lines.filter((line) => "accept" in line);
            if (ex.lines.length < 2 || ex.lines.length > 8) c.error("exercise.dialogue_line_count", u.id, `${where}: dialogues need 2 to 8 lines`);
            if (gaps.length !== 1) c.error("exercise.dialogue_gap_count", u.id, `${where}: exactly one line must be missing`);
            for (const line of ex.lines) if ("accept" in line) {
              if (line.accept.length === 0) c.error("exercise.accept_required", u.id, `${where}: the missing line needs at least one accepted reply`);
              for (const answer of line.accept) if (!evaluate(ex, { type: "dialogue_gap", text: answer }).correct) c.error("exercise.self_check", u.id, `${where}: accepted reply "${answer}" does not evaluate as correct`);
            }
            break;
          }
          case "read_question": {
            const correct = ex.options.filter((option) => option.correct);
            if (ex.options.length < 2) c.error("exercise.choice_count", u.id, `${where}: at least two reading answers are required`);
            if (correct.length !== 1) c.error("exercise.choice_correct_count", u.id, `${where}: exactly one reading answer must be correct`);
            const ids = new Set<string>();
            for (const option of ex.options) {
              if (ids.has(option.id)) c.error("exercise.option_id", u.id, `${where}: duplicate option id ${option.id}`);
              ids.add(option.id);
              if (!option.de.trim()) c.error("exercise.option_empty", u.id, `${where}: reading option ${option.id} is empty`);
              if (!option.correct && !option.feedback) c.warn("exercise.distractor_feedback", u.id, `${where}: reading distractor ${option.id} has no targeted feedback`);
            }
            if (correct[0] && !evaluate(ex, { type: "read_question", optionId: correct[0].id }).correct) c.error("exercise.self_check", u.id, `${where}: correct reading answer does not evaluate as correct`);
            break;
          }
          case "preposition_choice": {
            const correct = ex.options.filter((option) => option.correct);
            if (ex.options.length < 2) c.error("exercise.choice_count", u.id, `${where}: at least two prepositions are required`);
            if (correct.length !== 1) c.error("exercise.choice_correct_count", u.id, `${where}: exactly one preposition must be correct`);
            const ids = new Set<string>();
            for (const option of ex.options) {
              if (ids.has(option.id)) c.error("exercise.option_id", u.id, `${where}: duplicate option id ${option.id}`);
              ids.add(option.id);
              if (!option.de.trim()) c.error("exercise.option_empty", u.id, `${where}: preposition option ${option.id} is empty`);
              if (!option.correct && !option.feedback) c.warn("exercise.distractor_feedback", u.id, `${where}: preposition distractor ${option.id} has no targeted feedback`);
            }
            if (correct[0] && !evaluate(ex, { type: "preposition_choice", optionId: correct[0].id }).correct) c.error("exercise.self_check", u.id, `${where}: correct preposition does not evaluate as correct`);
            break;
          }
          case "case_choice": {
            const correct = ex.options.filter((option) => option.correct);
            if (ex.options.length < 2) c.error("exercise.choice_count", u.id, `${where}: at least two case forms are required`);
            if (correct.length !== 1) c.error("exercise.choice_correct_count", u.id, `${where}: exactly one case form must be correct`);
            const ids = new Set<string>();
            for (const option of ex.options) {
              if (ids.has(option.id)) c.error("exercise.option_id", u.id, `${where}: duplicate option id ${option.id}`);
              ids.add(option.id);
              if (!option.de.trim()) c.error("exercise.option_empty", u.id, `${where}: case option ${option.id} is empty`);
              if (!option.correct && !option.feedback) c.warn("exercise.distractor_feedback", u.id, `${where}: case distractor ${option.id} has no targeted feedback`);
            }
            if (correct[0] && !evaluate(ex, { type: "case_choice", optionId: correct[0].id }).correct) c.error("exercise.self_check", u.id, `${where}: correct case form does not evaluate as correct`);
            break;
          }
          case "connector_choice": {
            const correct = ex.options.filter((option) => option.correct);
            if (ex.options.length < 2) c.error("exercise.choice_count", u.id, `${where}: at least two connectors are required`);
            if (correct.length !== 1) c.error("exercise.choice_correct_count", u.id, `${where}: exactly one connector must be correct`);
            const ids = new Set<string>();
            for (const option of ex.options) {
              if (ids.has(option.id)) c.error("exercise.option_id", u.id, `${where}: duplicate option id ${option.id}`);
              ids.add(option.id);
              if (!option.de.trim()) c.error("exercise.option_empty", u.id, `${where}: connector option ${option.id} is empty`);
              if (!option.correct && !option.feedback) c.warn("exercise.distractor_feedback", u.id, `${where}: connector distractor ${option.id} has no targeted feedback`);
            }
            if (correct[0] && !evaluate(ex, { type: "connector_choice", optionId: correct[0].id }).correct) c.error("exercise.self_check", u.id, `${where}: correct connector does not evaluate as correct`);
            break;
          }
          case "negation": {
            const negationWord = /\b(?:nicht|kein\w*)\b/iu;
            for (const answer of ex.accept) {
              if (!evaluate(ex, { type: "negation", text: answer }).correct) c.error("exercise.self_check", u.id, `${where}: accepted negation "${answer}" does not evaluate as correct`);
              if (!negationWord.test(answer)) c.error("exercise.negation_missing", u.id, `${where}: accepted answer "${answer}" must use nicht or a form of kein`);
              if (answersEqual(answer, ex.source_de)) c.error("exercise.negation_unchanged", u.id, `${where}: accepted answer must change the positive source sentence`);
            }
            if (ex.accept.length === 0) c.error("exercise.accept_required", u.id, `${where}: at least one accepted negated sentence is required`);
            break;
          }
        }
      } catch (err) {
        c.error("exercise.evaluation_failed", u.id, `${where}: ${(err as Error).message}`);
      }
    }
  }
}

export interface CoverageRow {
  lang: string;
  entities: number;
  complete: number;
  reviewed: number;
  stale: number;
  missingKeys: number;
}

function checkLocalization(c: Collector, repo: ContentRepo): CoverageRow[] {
  const langs = repo.languages.languages;
  const codes = new Set<string>();
  for (const l of langs) {
    if (codes.has(l.code)) c.error("lang.duplicate", undefined, `language "${l.code}" listed twice`);
    codes.add(l.code);
  }
  const pivots = langs.filter((l) => l.pivot);
  if (pivots.length !== 1) c.error("lang.pivot", undefined, `exactly one pivot language required, found ${pivots.length}`);
  const pivot = pivots[0]?.code ?? "en";

  const entities = new Map<string, unknown>([...repo.concepts, ...repo.units, ...repo.routes]);
  const keysByEntity = new Map<string, Set<string>>();
  for (const [id, e] of entities) keysByEntity.set(id, collectKeys(e));

  for (const loc of repo.l10n.values()) {
    const fileKey = `${loc.lang}:${loc.entity}`;
    if (!codes.has(loc.lang)) c.error("l10n.unknown_lang", loc.entity, `${fileKey}: language not in registry`);
    const ent = entities.get(loc.entity) as { version: string } | undefined;
    if (!ent) { c.error("l10n.unknown_entity", undefined, `${fileKey}: no such entity`); continue; }
    const keys = keysByEntity.get(loc.entity) ?? new Set();
    for (const k of Object.keys(loc.strings)) if (!keys.has(k)) c.warn("l10n.orphan_key", loc.entity, `${loc.lang}: key "${k}" is not referenced by the entity`);
    if (loc.based_on_version !== ent.version) c.warn("l10n.stale", loc.entity, `${loc.lang}: translation based on ${loc.based_on_version}, entity is ${ent.version}`);
    if (loc.status === "reviewed" && !loc.reviewer) c.error("l10n.reviewer_missing", loc.entity, `${loc.lang}: status "reviewed" requires reviewer`);
    for (const [k, v] of Object.entries(loc.strings)) if (!v.trim()) c.error("l10n.empty", loc.entity, `${loc.lang}: key "${k}" is empty`);
  }

  for (const [id, keys] of keysByEntity) {
    const pv = repo.l10n.get(`${pivot}:${id}`);
    if (!pv) { c.error("l10n.pivot_missing", id, `missing pivot (${pivot}) localization file`); continue; }
    for (const k of keys) if (!(k in pv.strings)) c.error("l10n.pivot_key_missing", id, `pivot (${pivot}) is missing key "${k}"`);
  }

  const rows: CoverageRow[] = [];
  for (const l of langs.filter((x) => x.explanations)) {
    const row: CoverageRow = { lang: l.code, entities: keysByEntity.size, complete: 0, reviewed: 0, stale: 0, missingKeys: 0 };
    for (const [id, keys] of keysByEntity) {
      const loc = repo.l10n.get(`${l.code}:${id}`);
      const missing = [...keys].filter((k) => !loc || !(k in loc.strings)).length;
      row.missingKeys += missing;
      if (loc && missing === 0) {
        row.complete++;
        if (loc.status === "reviewed") row.reviewed++;
      }
      const ent = entities.get(id) as { version: string };
      if (loc && loc.based_on_version !== ent.version) row.stale++;
    }
    rows.push(row);
  }
  return rows;
}

export interface CheckReport {
  issues: Issue[];
  coverage: CoverageRow[];
}

export function runChecks(repo: ContentRepo): CheckReport {
  const c = new Collector(repo);
  checkIds(c, repo);
  checkReferences(c, repo);
  for (const cyc of findPrerequisiteCycles(repo.concepts)) {
    c.error("graph.cycle", cyc[0], `prerequisite cycle: ${cyc.join(" -> ")}`);
  }
  checkStatuses(c, repo);
  checkExercises(c, repo);
  const coverage = checkLocalization(c, repo);
  return { issues: c.issues, coverage };
}
