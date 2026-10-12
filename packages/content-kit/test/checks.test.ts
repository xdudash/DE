import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { runChecks, unitExercises } from "../src/checks.ts";
import { collectKeys, resolveKey } from "../src/l10n.ts";
import { conceptTallies, formatTable } from "../src/report.ts";
import type { ContentRepo, WordOrderExercise } from "../src/types.ts";
import { concept, l10n, validRepo } from "./fixtures.ts";

const codes = (repo: ContentRepo, severity: "error" | "warning" = "error") =>
  runChecks(repo).issues.filter((i) => i.severity === severity).map((i) => i.code);

const firstExercise = (repo: ContentRepo) => unitExercises([...repo.units.values()][0]!)[0] as WordOrderExercise;

describe("runChecks", () => {
  it("passes the valid fixture with no errors", () => {
    assert.deepEqual(codes(validRepo()), []);
  });
  it("reports dangling concept references", () => {
    const repo = validRepo();
    repo.units.get("unit.syntax.v2.a1")!.prerequisites = ["concept.syntax.missing"];
    assert.ok(codes(repo).includes("ref.concept"));
  });
  it("reports prerequisite cycles", () => {
    const repo = validRepo();
    repo.concepts.set("concept.syntax.a", concept("concept.syntax.a", { relations: [{ type: "depends_on", target: "concept.syntax.b" }] }));
    repo.concepts.set("concept.syntax.b", concept("concept.syntax.b", { relations: [{ type: "depends_on", target: "concept.syntax.a" }] }));
    assert.ok(codes(repo).includes("graph.cycle"));
  });
  it("blocks teaching a planned concept", () => {
    const repo = validRepo();
    repo.concepts.get("concept.syntax.v2")!.status = "planned";
    assert.ok(codes(repo).includes("status.planned_taught"));
  });
  it("refuses approved status without completed human review", () => {
    const repo = validRepo();
    repo.units.get("unit.syntax.v2.a1")!.status = "approved";
    assert.ok(codes(repo).includes("status.unreviewed_approved"));
  });
  it("reports an accepted word-order answer that cannot be built from tokens", () => {
    const repo = validRepo();
    firstExercise(repo).accept.push("Ich fahre nach Berlin.");
    assert.ok(codes(repo).includes("exercise.unbuildable_answer"));
  });
  it("reports an error rule that shadows an accepted answer", () => {
    const repo = validRepo();
    firstExercise(repo).feedback.rules!.push({ match: ["Ich fahre morgen nach Wien."], feedback: "@v3" });
    assert.ok(codes(repo).includes("exercise.rule_shadows_answer"));
  });
  it("reports an unknown objective", () => {
    const repo = validRepo();
    firstExercise(repo).objective = "nope";
    assert.ok(codes(repo).includes("ref.objective"));
  });
  it("requires every key in the pivot language", () => {
    const repo = validRepo();
    delete repo.l10n.get("en:unit.syntax.v2.a1")!.strings["why"];
    assert.ok(codes(repo).includes("l10n.pivot_key_missing"));
  });
  it("treats missing non-pivot keys as coverage, not as errors", () => {
    const repo = validRepo();
    delete repo.l10n.get("ru:unit.syntax.v2.a1")!.strings["why"];
    assert.deepEqual(codes(repo), []);
    const ru = runChecks(repo).coverage.find((r) => r.lang === "ru")!;
    assert.equal(ru.missingKeys, 1);
    assert.equal(ru.complete, 1);
  });
  it("warns on stale translations after a canonical version bump", () => {
    const repo = validRepo();
    repo.units.get("unit.syntax.v2.a1")!.version = "1.1.0";
    assert.ok(codes(repo, "warning").includes("l10n.stale"));
  });
  it("rejects use of a non-approved source", () => {
    const repo = validRepo();
    repo.sources.sources.push({ id: "src.tatoeba", name: "Tatoeba", license: "CC BY 2.0 FR", allowed_use: ["internal_research"], status: "candidate" });
    repo.units.get("unit.syntax.v2.a1")!.sources = [{ source: "src.tatoeba" }];
    assert.ok(codes(repo).includes("rights.source_not_approved"));
  });
});

describe("localization helpers", () => {
  it("collects @keys deterministically from nested structures", () => {
    assert.deepEqual([...collectKeys({ a: "@x", b: ["@y", { c: "plain", d: "@x" }] })], ["x", "y"]);
  });
  it("falls back to the pivot and flags the fallback", () => {
    const repo = validRepo();
    delete repo.l10n.get("ru:unit.syntax.v2.a1")!.strings["why"];
    const r = resolveKey(repo.l10n, "unit.syntax.v2.a1", "@why", { lang: "ru", pivot: "en" });
    assert.deepEqual(r, { text: "en:why", lang: "en", fallback: true });
  });
});

describe("route ordering", () => {
  const prereq = (target: string) => ({ type: "depends_on" as const, target });
  function repoWithRoute(steps: { unit?: string; concept?: string }[]): ContentRepo {
    const repo = validRepo();
    repo.concepts.set("concept.syntax.base", concept("concept.syntax.base"));
    repo.concepts.get("concept.syntax.v2")!.relations = [prereq("concept.syntax.base")];
    repo.routes.set("route.core.test", {
      schema: "deutschgo.route/1", id: "route.core.test", version: "0.1.0", status: "draft",
      title: "@title", summary: "@summary", goals: ["general"], cefr: { from: "A1", to: "A2" }, steps,
    });
    for (const lang of ["en", "ru"]) {
      repo.l10n.set(`${lang}:route.core.test`, l10n("route.core.test", lang, ["title", "summary"], "0.1.0"));
      repo.l10n.set(`${lang}:concept.syntax.base`, l10n("concept.syntax.base", lang, ["title", "summary"]));
    }
    return repo;
  }
  const warnings = (repo: ContentRepo) =>
    runChecks(repo).issues.filter((i) => i.code === "route.prerequisite_order").map((i) => i.message);

  it("accepts a route that teaches prerequisites first", () => {
    assert.deepEqual(warnings(repoWithRoute([{ concept: "concept.syntax.base" }, { concept: "concept.syntax.v2" }])), []);
  });
  it("warns when a prerequisite comes later in the route", () => {
    const w = warnings(repoWithRoute([{ concept: "concept.syntax.v2" }, { concept: "concept.syntax.base" }]));
    assert.equal(w.length, 1);
    assert.match(w[0]!, /teaches later/);
  });
  it("warns when a prerequisite is missing from the route entirely", () => {
    const w = warnings(repoWithRoute([{ concept: "concept.syntax.v2" }]));
    assert.match(w[0]!, /never covers/);
  });
  it("accepts a unit whose prerequisites are declared as assumed knowledge", () => {
    const u = [...repoWithRoute([]).units.values()][0]!;
    const repo = repoWithRoute([{ unit: u.id }]);
    repo.units.get(u.id)!.prerequisites = ["concept.syntax.base"];
    assert.deepEqual(warnings(repo), []);
  });
});

describe("curriculum report", () => {
  const c = (id: string, level: "A1" | "A2", domain: string, status: "planned" | "draft" | "approved") =>
    concept(id, { status, domain, cefr: { introduced: level } });
  const concepts = [
    c("concept.a.one", "A1", "syntax", "planned"),
    c("concept.a.two", "A1", "syntax", "draft"),
    c("concept.a.three", "A2", "verbs", "approved"),
  ];

  it("works when given a live iterator, not only an array", () => {
    const map = new Map(concepts.map((x) => [x.id, x]));
    const { byLevel, byStrand } = conceptTallies(map.values());
    assert.equal(byLevel.reduce((n, r) => n + r.total, 0), 3);
    assert.equal(byStrand.reduce((n, r) => n + r.total, 0), 3, "both tables must see every concept");
  });
  it("counts by level in CEFR order and by strand alphabetically", () => {
    const { byLevel, byStrand } = conceptTallies(concepts);
    assert.deepEqual(byLevel.map((r) => [r.label, r.total]), [["A1", 2], ["A2", 1]]);
    assert.deepEqual(byLevel[0]!.byStatus, { planned: 1, draft: 1 });
    assert.deepEqual(byStrand.map((r) => r.label), ["syntax", "verbs"]);
  });
  it("renders only statuses that occur, plus a totals row", () => {
    const text = formatTable("Concepts by CEFR level", conceptTallies(concepts).byLevel);
    assert.match(text, /planned/);
    assert.doesNotMatch(text, /deprecated/);
    assert.match(text, /all {2,}3/);
  });
  it("renders a markdown table when asked", () => {
    const md = formatTable("T", conceptTallies(concepts).byLevel, true);
    assert.match(md, /^### T/);
    assert.match(md, /\| \*\*all\*\* \|/);
  });
});
