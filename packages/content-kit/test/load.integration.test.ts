/**
 * Integration tests: real YAML parsing + JSON Schema (needs npm dependencies; runs in CI).
 */
import { strict as assert } from "node:assert";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { runChecks } from "../src/checks.ts";
import { compileBundle } from "../src/compile.ts";
import { loadContent } from "../src/load.ts";

const here = dirname(fileURLToPath(import.meta.url));
const CONTENT = join(here, "../../../content");
const INVALID = join(here, "fixtures/invalid-content");

describe("repository content", () => {
  const { repo, issues } = loadContent(CONTENT);
  const report = runChecks(repo);

  it("loads without schema or parse errors", () => {
    assert.deepEqual(issues.filter((i) => i.severity === "error"), []);
  });
  it("passes all semantic checks", () => {
    assert.deepEqual(report.issues.filter((i) => i.severity === "error"), []);
  });
  it("contains the gold-standard V2 unit, still marked as not reviewed", () => {
    const u = repo.units.get("unit.syntax.v2_declarative.a1");
    assert.ok(u, "gold unit missing");
    assert.equal(u.status, "needs_review");
    assert.equal(u.review.linguistic.status, "pending");
  });
  it("compiles a deterministic bundle", () => {
    const a = JSON.stringify(compileBundle(repo, report.coverage));
    const b = JSON.stringify(compileBundle(loadContent(CONTENT).repo, report.coverage));
    assert.equal(a, b);
  });
});

describe("invalid fixtures", () => {
  const { issues } = loadContent(INVALID);
  const has = (code: string, fileFragment: string) => issues.some((i) => i.code === code && (i.file ?? "").includes(fileFragment));
  it("rejects a schema violation with a useful path", () => {
    assert.ok(has("schema.invalid", "concept.bad.missing_summary"), JSON.stringify(issues, null, 1));
    assert.ok(issues.some((i) => i.message.includes("summary")));
  });
  it("rejects a file whose name does not match its id", () => assert.ok(has("file.name", "wrong-file-name")));
  it("rejects duplicate YAML keys", () => assert.ok(has("yaml.parse", "unit.bad.duplicate_key")));
});
