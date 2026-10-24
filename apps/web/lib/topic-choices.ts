/**
 * The learner's own course, built from the plan in curriculum/course.json (ADR-0018).
 *
 * Three inputs decide what a learner sees:
 *   - the tier (fast, medium, full), which keeps the lessons of that depth;
 *   - "want" on a topic, which adds its lessons even outside the tier;
 *   - "skip" on a topic, which removes its lessons.
 * A skipped topic that a kept lesson builds on is not removed silently: it is reported as
 * a conflict, so the learner can see what depends on what and decide.
 * The chain is rebuilt over the kept lessons, so `previous` always points at a kept lesson.
 */
export type Depth = "core" | "standard" | "deep";
export type Tier = "fast" | "medium" | "full";
export type Choice = "want" | "skip";

export interface CourseLesson {
  readonly id: string;
  readonly kind: "lesson" | "scenario" | "checkpoint";
  readonly depth: Depth;
  /** A concept key for lessons, `scenario:N` or `checkpoint:BLOCK` otherwise. */
  readonly topic: string;
  readonly previous: string;
  readonly builds_on: readonly string[];
}

export interface Conflict {
  readonly id: string;
  readonly topic: string;
}

export interface Plan {
  readonly lessons: readonly (CourseLesson & { readonly previous: string })[];
  readonly dropped: readonly { readonly id: string; readonly reason: "tier" | "skipped" }[];
  readonly conflicts: readonly Conflict[];
}

export const TIER_DEPTHS: Readonly<Record<Tier, readonly Depth[]>> = {
  fast: ["core"],
  medium: ["core", "standard"],
  full: ["core", "standard", "deep"],
};

export function buildPlan(course: readonly CourseLesson[], tier: Tier, choices: Readonly<Record<string, Choice>>): Plan {
  const kept: CourseLesson[] = [];
  const dropped: { id: string; reason: "tier" | "skipped" }[] = [];

  for (const lesson of course) {
    const choice = choices[lesson.topic];
    if (choice === "skip") {
      dropped.push({ id: lesson.id, reason: "skipped" });
      continue;
    }
    const inTier = lesson.kind === "checkpoint" || TIER_DEPTHS[tier].includes(lesson.depth);
    if (choice === "want" || inTier) kept.push(lesson);
    else dropped.push({ id: lesson.id, reason: "tier" });
  }

  const skipped = new Set(Object.keys(choices).filter((topic) => choices[topic] === "skip"));
  const conflicts: Conflict[] = kept.flatMap((lesson) =>
    lesson.builds_on.filter((topic) => skipped.has(topic)).map((topic) => ({ id: lesson.id, topic })),
  );

  // The chain over the kept lessons: each one follows the kept lesson before it.
  const lessons = kept.map((lesson, i) => ({ ...lesson, previous: i === 0 ? "—" : kept[i - 1]!.id }));
  return { lessons, dropped, conflicts };
}
