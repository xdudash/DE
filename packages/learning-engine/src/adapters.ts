/** Builds engine inputs from the compiled content bundle (type-only dependency on content-kit). */
import type { ContentBundle } from "@deutschgo/content-kit";
import type { GraphConcept, RouteStep } from "./types.ts";

export function graphFromBundle(bundle: Pick<ContentBundle, "concepts">): GraphConcept[] {
  return bundle.concepts.map((c) => ({
    id: c.id,
    dependsOn: (c.relations ?? []).filter((r) => r.type === "depends_on").map((r) => r.target),
  }));
}

export function routeFromBundle(bundle: Pick<ContentBundle, "routes" | "units">, routeId: string): RouteStep[] {
  const route = bundle.routes.find((r) => r.id === routeId);
  if (!route) throw new Error(`unknown route ${routeId}`);
  const units = new Map(bundle.units.map((u) => [u.id, u]));
  return route.steps.map((s) => {
    if (s.unit) {
      const u = units.get(s.unit);
      if (!u) throw new Error(`route ${routeId} references unknown unit ${s.unit}`);
      return { target: s.unit, kind: "unit" as const, concepts: u.concepts, ...(s.optional ? { optional: true } : {}) };
    }
    return { target: s.concept!, kind: "concept" as const, concepts: [s.concept!], ...(s.optional ? { optional: true } : {}) };
  });
}
