import type { CheckReport } from "./checks.ts";
import type { Issue } from "./types.ts";

export function formatIssues(issues: Issue[]): string {
  return issues
    .map((i) => `${i.severity.toUpperCase().padEnd(7)} ${i.code.padEnd(32)} ${i.file ?? i.entity ?? "-"}: ${i.message}`)
    .join("\n");
}

export function formatCoverage(report: CheckReport): string {
  const head = "lang  entities  complete  reviewed  stale  missing_keys";
  const rows = report.coverage.map((r) =>
    `${r.lang.padEnd(5)} ${String(r.entities).padStart(8)}  ${String(r.complete).padStart(8)}  ${String(r.reviewed).padStart(8)}  ${String(r.stale).padStart(5)}  ${String(r.missingKeys).padStart(12)}`,
  );
  return [head, ...rows].join("\n");
}
