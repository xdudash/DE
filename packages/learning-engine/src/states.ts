/**
 * Concept state derivation v1 (docs/domain/LEARNING_ENGINE.md).
 * States are always recomputed from the full event list: deterministic,
 * order-independent, and safe under sync and algorithm changes.
 *
 * Precedence (first match wins):
 *  1. no graded/exposure evidence            → unseen | available
 *  2. recent accuracy < 70 % (≥3 results) or
 *     ≥2 signalled errors in 7 days           → needs_practice
 *  3. review due date passed                  → review_due
 *  4. ≥2 successful reviews ≥1 day apart and
 *     last review successful                  → provisionally_mastered
 *
 * A review is an explicit recall or any graded result given while the concept was due
 * (scheduler.ts, ADR-0016).
 *  5. otherwise                               → in_progress
 */
import { DAY_MS, reviewHistory } from "./scheduler.ts";
import type { ConceptState, ConceptStatus, EvidenceSummary, GraphConcept, LearningEvent, StateReason } from "./types.ts";

/** Bumped whenever state thresholds or transitions change; stored with derived rows. */
export const ENGINE_VERSION = "1.1.0";

export const RECENT_WINDOW = 5;
export const MIN_GRADED_FOR_ACCURACY = 3;
export const ACCURACY_THRESHOLD = 0.7;
export const SIGNAL_WINDOW_DAYS = 7;
export const SIGNAL_THRESHOLD = 2;
export const MIN_RECALL_GAP_MS = DAY_MS;

const isGraded = (e: LearningEvent) =>
  (e.kind === "attempt" || e.kind === "recall" || e.kind === "transfer") && typeof e.correct === "boolean";

const byTime = (a: LearningEvent, b: LearningEvent) => a.at - b.at || a.id.localeCompare(b.id);

/** States that count as "this prerequisite is in place" for availability. */
const PREREQ_OK: ReadonlySet<ConceptState> = new Set(["in_progress", "review_due", "provisionally_mastered"]);

export function summarize(conceptId: string, own: LearningEvent[], all: LearningEvent[], now: number): EvidenceSummary {
  const sorted = [...own].sort(byTime);
  const graded = sorted.filter(isGraded);
  const recent = graded.slice(-RECENT_WINDOW);
  const history = reviewHistory(sorted);
  const windowStart = now - SIGNAL_WINDOW_DAYS * DAY_MS;
  const recentSignals = all.filter(
    (e) => e.correct === false && e.at >= windowStart && e.at <= now && (e.signals ?? []).includes(conceptId),
  ).length;
  return {
    attempts: sorted.filter((e) => e.kind === "attempt").length,
    correct: graded.filter((e) => e.correct).length,
    recentAccuracy: recent.length ? recent.filter((e) => e.correct).length / recent.length : null,
    recentGraded: recent.length,
    recalls: history.reviews.length,
    successfulRecalls: history.reviews.filter((r) => r.correct).length,
    transfers: sorted.filter((e) => e.kind === "transfer").length,
    recentSignals,
    lastActivityAt: sorted.length ? sorted[sorted.length - 1]!.at : null,
    review: history.schedule,
  };
}

/** ≥2 successful reviews at least one day apart, and the most recent review succeeded. */
export function hasDelayedRecall(own: LearningEvent[]): boolean {
  const { reviews } = reviewHistory(own);
  const last = reviews[reviews.length - 1];
  if (!last || !last.correct) return false;
  const ok = reviews.filter((r) => r.correct);
  const first = ok[0];
  return ok.length >= 2 && !!first && last.at - first.at >= MIN_RECALL_GAP_MS;
}

function classify(own: LearningEvent[], ev: EvidenceSummary, now: number): { state: ConceptState; because: StateReason } | null {
  if (own.length === 0 || own.every((e) => e.kind === "self_report")) return null;
  if (ev.recentGraded >= MIN_GRADED_FOR_ACCURACY && (ev.recentAccuracy ?? 1) < ACCURACY_THRESHOLD) {
    return { state: "needs_practice", because: "low_recent_accuracy" };
  }
  if (ev.recentSignals >= SIGNAL_THRESHOLD) return { state: "needs_practice", because: "repeated_signalled_error" };
  if (ev.review && now >= ev.review.dueAt) return { state: "review_due", because: "review_overdue" };
  if (hasDelayedRecall(own)) return { state: "provisionally_mastered", because: "delayed_recall_confirmed" };
  return { state: "in_progress", because: "practising" };
}

/**
 * Derives a status for every concept in the graph. Concepts without evidence are
 * `available` when all their direct prerequisites are in progress or better and not
 * weak, otherwise `unseen`. Availability is guidance only — nothing is ever locked.
 */
export function deriveConceptStates(graph: GraphConcept[], events: LearningEvent[], now: number): Map<string, ConceptStatus> {
  const relevant = events.filter((e) => e.at <= now);
  const byConcept = new Map<string, LearningEvent[]>();
  for (const e of relevant) for (const c of new Set(e.conceptIds)) byConcept.set(c, [...(byConcept.get(c) ?? []), e]);

  const out = new Map<string, ConceptStatus>();
  for (const c of graph) {
    const own = byConcept.get(c.id) ?? [];
    const evidence = summarize(c.id, own, relevant, now);
    const r = classify(own, evidence, now);
    if (r) out.set(c.id, { conceptId: c.id, ...r, evidence });
  }
  // Second pass: availability depends on the evidence-based states above.
  for (const c of graph) {
    if (out.has(c.id)) continue;
    const own = byConcept.get(c.id) ?? [];
    const evidence = summarize(c.id, own, relevant, now);
    const met = c.dependsOn.every((p) => {
      const s = out.get(p);
      return !!s && PREREQ_OK.has(s.state) && s.evidence.correct > 0;
    });
    out.set(c.id, met
      ? { conceptId: c.id, state: "available", because: "prerequisites_met", evidence }
      : { conceptId: c.id, state: "unseen", because: "no_evidence", evidence });
  }
  return out;
}
