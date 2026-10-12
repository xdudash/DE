import type { CheckReport } from "./checks.ts";
import type { Cefr, Concept, ContentStatus, Issue, Unit } from "./types.ts";

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

/* ------------------------------------------------------------------ curriculum report */

const LEVELS: Cefr[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const STATUSES: ContentStatus[] = ["planned", "draft", "needs_review", "approved", "published", "deprecated"];

export interface Tally {
  label: string;
  total: number;
  byStatus: Partial<Record<ContentStatus, number>>;
}

/** Groups entities by a key, counting statuses. Order: `order` first, then the rest sorted. */
export function tallyBy<T extends { status: ContentStatus }>(
  items: Iterable<T>,
  key: (item: T) => string,
  order: string[] = [],
): Tally[] {
  const rows = new Map<string, Tally>();
  for (const item of items) {
    const k = key(item);
    const row = rows.get(k) ?? { label: k, total: 0, byStatus: {} };
    row.total += 1;
    row.byStatus[item.status] = (row.byStatus[item.status] ?? 0) + 1;
    rows.set(k, row);
  }
  const ordered = order.filter((k) => rows.has(k));
  const rest = [...rows.keys()].filter((k) => !ordered.includes(k)).sort();
  return [...ordered, ...rest].map((k) => rows.get(k)!);
}

export function conceptTallies(concepts: Iterable<Concept>) {
  // Materialise once: callers pass Map.values(), and an iterator is consumed by
  // the first pass, which would silently empty the second table.
  const all = [...concepts];
  return {
    byLevel: tallyBy(all, (c) => c.cefr.introduced, LEVELS),
    byStrand: tallyBy(all, (c) => c.domain),
  };
}

export function unitTallies(units: Iterable<Unit>) {
  return tallyBy([...units], (u) => u.cefr, LEVELS);
}

/** True when the report has nothing to show, so the CLI can say so explicitly. */
export function isEmptyReport(rows: Tally[]): boolean {
  return rows.length === 0;
}

export function formatTable(title: string, rows: Tally[], markdown = false): string {
  const cols = STATUSES.filter((s) => rows.some((r) => r.byStatus[s]));
  const head = ["", "total", ...cols];
  const body = rows.map((r) => [r.label, String(r.total), ...cols.map((s) => String(r.byStatus[s] ?? 0))]);
  const totals = ["all", String(rows.reduce((n, r) => n + r.total, 0)),
    ...cols.map((s) => String(rows.reduce((n, r) => n + (r.byStatus[s] ?? 0), 0)))];
  if (markdown) {
    return [`### ${title}`, "", `| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`,
      ...body.map((r) => `| ${r.join(" | ")} |`), `| ${totals.map((t) => `**${t}**`).join(" | ")} |`, ""].join("\n");
  }
  const table = [head, ...body, totals];
  const width = head.map((_, i) => Math.max(...table.map((r) => (r[i] ?? "").length)));
  return [`${title}:`, ...table.map((r) => r.map((cell, i) => cell.padEnd(width[i]!)).join("  "))].join("\n") + "\n";
}
