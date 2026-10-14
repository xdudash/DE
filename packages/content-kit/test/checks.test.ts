import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { runChecks, unitExercises } from "../src/checks.ts";
import { collectKeys, resolveKey } from "../src/l10n.ts";
import type { ContentRepo, WordOrderExercise } from "../src/types.ts";
import { concept, validRepo } from "./fixtures.ts";

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
