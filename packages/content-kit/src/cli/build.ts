#!/usr/bin/env node
/** Usage: build.ts <content-dir> <out.json>  — refuses to build when validation has errors. */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { runChecks } from "../checks.ts";
import { compileBundle } from "../compile.ts";
import { loadContent } from "../load.ts";
import { formatIssues } from "../report.ts";

const [dir = "content", out = "content.json"] = process.argv.slice(2);
const { repo, issues } = loadContent(dir);
const report = runChecks(repo);
const errors = [...issues, ...report.issues].filter((i) => i.severity === "error");
if (errors.length) {
  console.error(formatIssues(errors));
  console.error(`Refusing to build bundle: ${errors.length} validation error(s).`);
  process.exit(1);
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(compileBundle(repo, report.coverage), null, 2) + "\n");
console.log(`Wrote ${out}`);
