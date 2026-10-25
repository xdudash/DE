import { unitExercises, type ContentBundle } from "@deutschgo/content-kit";

export interface MissionSummary { unitId: string; title: string; summary: string; level: string; exerciseCount: number; reviewed: boolean }

/** Scenario missions reuse existing content and the normal evaluator / lesson flow. */
export function scenarioMissions(bundle: ContentBundle, text: (unitId: string, ref: string) => string): MissionSummary[] {
  return bundle.units.flatMap((unit) => {
    const count = unitExercises(unit).filter((exercise) => exercise.type === "reply_choice").length;
    if (count === 0) return [];
    return [{ unitId: unit.id, title: text(unit.id, unit.title), summary: text(unit.id, unit.summary), level: unit.cefr, exerciseCount: count, reviewed: unit.status === "approved" || unit.status === "published" }];
  });
}
