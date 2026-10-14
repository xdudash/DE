/** Concept-graph utilities. Prerequisites use one canonical edge: `depends_on`. */
import type { Concept } from "./types.ts";

export function prerequisitesOf(c: Concept): string[] {
  return (c.relations ?? []).filter((r) => r.type === "depends_on").map((r) => r.target);
}

/** Returns every prerequisite cycle as a list of ids (first id repeated at end). */
export function findPrerequisiteCycles(concepts: Map<string, Concept>): string[][] {
  const WHITE = 0, GREY = 1, BLACK = 2;
  const color = new Map<string, number>();
  const stack: string[] = [];
  const cycles: string[][] = [];

  const visit = (id: string): void => {
    color.set(id, GREY);
    stack.push(id);
    const c = concepts.get(id);
    for (const next of c ? prerequisitesOf(c) : []) {
      if (!concepts.has(next)) continue; // dangling refs are reported elsewhere
      const col = color.get(next) ?? WHITE;
      if (col === GREY) {
        const start = stack.indexOf(next);
        cycles.push([...stack.slice(start), next]);
      } else if (col === WHITE) {
        visit(next);
      }
    }
    stack.pop();
    color.set(id, BLACK);
  };

  for (const id of [...concepts.keys()].sort()) {
    if ((color.get(id) ?? WHITE) === WHITE) visit(id);
  }
  return cycles;
}

/** All transitive prerequisites of `id`, nearest first (BFS order), excluding `id`. */
export function transitivePrerequisites(concepts: Map<string, Concept>, id: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>([id]);
  const queue = [id];
  while (queue.length) {
    const cur = queue.shift()!;
    const c = concepts.get(cur);
    for (const p of c ? prerequisitesOf(c) : []) {
      if (seen.has(p)) continue;
      seen.add(p);
      out.push(p);
      queue.push(p);
    }
  }
  return out;
}

/** Deterministic topological order (prerequisites first; ties by id). Throws on cycles. */
export function topologicalOrder(concepts: Map<string, Concept>): string[] {
  const indeg = new Map<string, number>();
  const dependents = new Map<string, string[]>();
  for (const id of concepts.keys()) indeg.set(id, 0);
  for (const [id, c] of concepts) {
    for (const p of prerequisitesOf(c)) {
      if (!concepts.has(p)) continue;
      indeg.set(id, (indeg.get(id) ?? 0) + 1);
      dependents.set(p, [...(dependents.get(p) ?? []), id]);
    }
  }
  const ready = [...indeg].filter(([, d]) => d === 0).map(([id]) => id).sort();
  const order: string[] = [];
  while (ready.length) {
    const id = ready.shift()!;
    order.push(id);
    for (const d of (dependents.get(id) ?? []).sort()) {
      const v = (indeg.get(d) ?? 0) - 1;
      indeg.set(d, v);
      if (v === 0) {
        ready.push(d);
        ready.sort();
      }
    }
  }
  if (order.length !== concepts.size) throw new Error("Prerequisite graph contains a cycle");
  return order;
}
