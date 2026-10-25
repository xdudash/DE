/**
 * Semantic (cross-file) checks that JSON Schema cannot express.
 * Input: an already schema-validated ContentRepo. Pure; no I/O.
 */
import { answersEqual, evaluate, findOrderFor } from "./evaluate.ts";
import { findPrerequisiteCycles, prerequisitesOf } from "./graph.ts";
import { collectKeys } from "./l10n.ts";
import { duplicateTitles, lessonNorms, NORM_EXEMPT } from "./norms.ts";
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
          case "reply_choice": {
            const n = ex.options.filter((o) => o.correct).length;
            if (n !== 1) c.error("exercise.choice_correct_count", u.id, `${where}: exactly one correct reply required, found ${n}`);
            const correct = ex.options.find((o) => o.correct);
            if (correct && !evaluate(ex, { type: "reply_choice", optionId: correct.id }).correct) c.error("exercise.self_check", u.id, `${where}: correct reply does not evaluate as correct`);
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
          case "transform": {
            for (const a of ex.accept) if (!evaluate(ex, { type: "transform", text: a }).correct) c.error("exercise.self_check", u.id, `${where}: accepted "${a}" does not evaluate as correct`);
            if (ex.accept.some((a) => answersEqual(a, ex.source_de))) c.warn("exercise.reveals_answer", u.id, `${where}: source sentence is already an accepted answer`);
            for (const r of ex.feedback.rules ?? []) for (const m of r.match) if (ex.accept.some((a) => answersEqual(a, m))) c.error("exercise.rule_shadows_answer", u.id, `${where}: error rule matches accepted "${m}"`);
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

/**
 * Lesson norms (src/norms.ts). Errors, except for the units listed in NORM_EXEMPT, which keep
 * warnings until they are brought up to the norms.
 */
function checkNorms(c: Collector, repo: ContentRepo): void {
  const pivot = repo.languages.languages.find((l) => l.pivot)?.code ?? "en";
  const titles = new Map<string, string>();
  for (const u of repo.units.values()) {
    const strings = repo.l10n.get(`${pivot}:${u.id}`)?.strings;
    const report = NORM_EXEMPT.has(u.id) ? c.warn.bind(c) : c.error.bind(c);
    for (const f of lessonNorms(u, strings)) report(f.code, u.id, f.message);
    const title = strings?.[u.title.replace(/^@/, "")];
    if (title) titles.set(u.id, title);
  }
  for (const ids of duplicateTitles(titles)) {
    for (const id of ids) {
      const report = NORM_EXEMPT.has(id) ? c.warn.bind(c) : c.error.bind(c);
      report("norm.duplicate_title", id, `title is shared with ${ids.filter((x) => x !== id).join(", ")}; one subtopic per lesson, one title per lesson`);
    }
  }
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
  checkNorms(c, repo);
  const coverage = checkLocalization(c, repo);
  return { issues: c.issues, coverage };
}
