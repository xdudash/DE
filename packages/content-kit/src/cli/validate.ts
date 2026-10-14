#!/usr/bin/env node
/** Usage: validate.ts <content-dir> [--strict]   (--strict: warnings fail too) */
import { runChecks } from "../checks.ts";
import { loadContent } from "../load.ts";
import { formatCoverage, formatIssues } from "../report.ts";

const dir = process.argv[2] ?? "content";
const strict = process.argv.includes("--strict");
const { repo, issues: loadIssues } = loadContent(dir);
const report = runChecks(repo);
const issues = [...loadIssues, ...report.issues];
const errors = issues.filter((i) => i.severity === "error");
const warnings = issues.filter((i) => i.severity === "warning");

console.log(`Content: ${repo.concepts.size} concepts, ${repo.units.size} units, ${repo.routes.size} routes, ${repo.l10n.size} localization files.`);
if (issues.length) console.log(formatIssues(issues));
console.log("\nExplanation-language coverage:\n" + formatCoverage(report));
console.log(`\n${errors.length} error(s), ${warnings.length} warning(s).`);
console.log("Note: structural validity does not certify German correctness, pedagogy, translation quality, or rights.");
process.exit(errors.length || (strict && warnings.length) ? 1 : 0);
