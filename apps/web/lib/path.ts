/**
 * The learning line on the home screen: which station a learner is at.
 * Pure, so the rules are tested directly (test/path.test.ts) and never guessed in a component.
 *
 * - planned: no lesson exists yet for this topic. It is shown, never offered.
 * - done:    every exercise of the lesson has been answered on this device.
 * - current: the first lesson that is not done. There is at most one.
 * - open:    any other lesson that exists (the learner may jump ahead).
 */

export type StationKind = "lesson" | "planned";
export type StationState = "done" | "current" | "open" | "planned";

export interface StationInput {
  kind: StationKind;
  /** Lesson unit id; absent for planned stations. */
  unitId?: string;
  exerciseIds: readonly string[];
}

/** Answered exercise ids per unit, as stored on this device. */
export type AnsweredByUnit = Record<string, ReadonlySet<string> | undefined>;

export interface RouteLessonInput {
  /** Route-step id used by the learning-engine recommendation. */
  id: string;
  unitId: string;
  exerciseIds: readonly string[];
}

/** Keep unfinished, startable lessons in the Home recommendation route. */
export function pendingRouteRecommendations<R extends { target: string }>(
  route: readonly R[],
  lessons: readonly RouteLessonInput[],
  answered: AnsweredByUnit,
): R[] {
  const pending = new Set(lessons.filter((lesson) => {
    const unitAnswers = answered[lesson.unitId];
    return lesson.exerciseIds.length === 0 || !lesson.exerciseIds.every((id) => unitAnswers?.has(id));
  }).map((lesson) => lesson.id));
  return route.filter((step) => pending.has(step.target));
}

export function stationStates(stations: readonly StationInput[], answered: AnsweredByUnit): StationState[] {
  let currentTaken = false;
  return stations.map((s) => {
    if (s.kind === "planned" || !s.unitId) return "planned";
    const done = answered[s.unitId];
    const finished = s.exerciseIds.length > 0 && s.exerciseIds.every((id) => done?.has(id));
    if (finished) return "done";
    if (!currentTaken) {
      currentTaken = true;
      return "current";
    }
    return "open";
  });
}

/** Stations finished out of all stations on the line (planned ones count toward the total). */
export function lineProgress(states: readonly StationState[]): { done: number; total: number } {
  return { done: states.filter((s) => s === "done").length, total: states.length };
}

/**
 * The line to show on the home screen: the route where a written lesson comes soonest,
 * so a new learner reaches something to do within the first stations rather than after a
 * column of topics in preparation. Ties go to the shorter route; no routes, no line.
 */
export function pickLine<R extends { steps: readonly unknown[] }>(routes: readonly R[], isLesson: (step: R["steps"][number]) => boolean): R | undefined {
  const firstLessonAt = (r: R) => {
    const i = r.steps.findIndex(isLesson);
    return i < 0 ? Number.POSITIVE_INFINITY : i;
  };
  return [...routes].sort((a, z) => firstLessonAt(a) - firstLessonAt(z) || a.steps.length - z.steps.length)[0];
}
