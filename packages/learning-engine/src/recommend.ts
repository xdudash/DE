/**
 * Explainable recommendations v1 (docs/domain/LEARNING_ENGINE.md, "Recommendation order").
 * Every item carries a reason code; the UI renders it and lets the learner override.
 */
import type { ConceptState, ConceptStatus, GraphConcept, Recommendation, RouteStep } from "./types.ts";

export interface RecommendInput {
  graph: GraphConcept[];
  states: Map<string, ConceptStatus>;
  /** Active route, in order (may be empty). */
  route: RouteStep[];
  /** Concept the learner explicitly asked to study, if any. */
  request?: string;
  /** Max review items to suggest (learner's daily budget). */
  reviewBudget: number;
  /** Max items to return. */
  limit: number;
}

/** A prerequisite is a gap if it has never been practised successfully or is weak. */
const GAP_STATES: ReadonlySet<ConceptState> = new Set(["unseen", "available", "needs_practice"]);
const KNOWN_STATES: ReadonlySet<ConceptState> = new Set(["provisionally_mastered", "review_due"]);

function isGap(s: ConceptStatus | undefined): boolean {
  return !s || GAP_STATES.has(s.state) || s.evidence.correct === 0;
}

/** Transitive prerequisite gaps of `id`, deepest first (learn foundations before what builds on them). */
export function prerequisiteGaps(graph: GraphConcept[], states: Map<string, ConceptStatus>, id: string): string[] {
  const deps = new Map(graph.map((c) => [c.id, c.dependsOn]));
  const order: string[] = [];
  const seen = new Set<string>();
  const visit = (cur: string) => {
    for (const p of [...(deps.get(cur) ?? [])].sort()) {
      if (seen.has(p)) continue;
      seen.add(p);
      visit(p); // post-order: foundations first
      if (isGap(states.get(p))) order.push(p);
    }
  };
  visit(id);
  return order;
}

export function recommend(input: RecommendInput): Recommendation[] {
  const out: Recommendation[] = [];
  const used = new Set<string>();
  const push = (r: Recommendation) => {
    if (out.length >= input.limit || used.has(r.target)) return;
    used.add(r.target);
    out.push(r);
  };

  // 1–2. Learner request, preceded by catch-up for prerequisite gaps.
  if (input.request) {
    for (const gap of prerequisiteGaps(input.graph, input.states, input.request)) {
      push({ target: gap, kind: "concept", reason: "prerequisite_of", reasonRef: input.request });
    }
    push({ target: input.request, kind: "concept", reason: "requested" });
  }

  // 3. Due reviews, most overdue first, within budget.
  const due = [...input.states.values()]
    .filter((s) => s.state === "review_due" && s.evidence.review)
    .sort((a, b) => a.evidence.review!.dueAt - b.evidence.review!.dueAt || a.conceptId.localeCompare(b.conceptId))
    .slice(0, Math.max(0, input.reviewBudget));
  for (const s of due) push({ target: s.conceptId, kind: "concept", reason: "review_due" });

  // 4. Weak concepts (needs_practice), most recently active first.
  const weak = [...input.states.values()]
    .filter((s) => s.state === "needs_practice")
    .sort((a, b) => (b.evidence.lastActivityAt ?? 0) - (a.evidence.lastActivityAt ?? 0) || a.conceptId.localeCompare(b.conceptId));
  for (const s of weak) push({ target: s.conceptId, kind: "concept", reason: "frequent_error" });

  // 5. Next route step that is not yet known (required steps before optional ones).
  const pending = input.route.filter((st) => !st.concepts.every((c) => KNOWN_STATES.has(input.states.get(c)?.state ?? "unseen")));
  const next = pending.find((st) => !st.optional) ?? pending[0];
  if (next) push({ target: next.target, kind: next.kind, reason: "route_next" });

  return out;
}
