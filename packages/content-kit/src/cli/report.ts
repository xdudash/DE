#!/usr/bin/env node
/**
 * Curriculum coverage report: what exists per level and strand, in which status,
 * and how complete each explanation language is. Read-only; feeds planning and the
 * content dashboard (docs/product/PRODUCT_SPEC.md, F13).
 *
 * Usage: report.ts <content-dir> [--markdown]
 */
import { runChecks } from "../checks.ts";
import { loadContent } from "../load.ts";
import { conceptTallies, formatCoverage, formatTable, unitTallies } from "../report.ts";

const dir = process.argv[2] ?? "content";
const md = process.argv.includes("--markdown");
const { repo, issues } = loadContent(dir);
const report = runChecks(repo);
const { byLevel, byStrand } = conceptTallies(repo.concepts.values());

console.log(formatTable("Concepts by CEFR level", byLevel, md));
console.log(formatTable("Concepts by strand", byStrand, md));
console.log(formatTable("Units by CEFR level", unitTallies(repo.units.values()), md));
console.log(md ? "### Explanation-language coverage\n\n```\n" + formatCoverage(report) + "\n```" : "Explanation-language coverage:\n" + formatCoverage(report));

const errors = [...issues, ...report.issues].filter((i) => i.severity === "error").length;
console.log(`\nRoutes: ${repo.routes.size}. Localization files: ${repo.l10n.size}. Validation errors: ${errors}.`);
console.log("Counts measure authored volume, not learning quality: only human-reviewed content may reach approved or published.");
