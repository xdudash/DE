import "server-only";
import curriculum from "../../../curriculum/course.json";
import type { PathDifficulty } from "./plan";

type CurriculumEntry = { level: string; depth: "core" | "standard" | "deep"; kind: "lesson" | "scenario" | "checkpoint" };
type PathCounts = { difficulty: PathDifficulty; steps: number; lessons: number; scenarios: number; checkpoints: number; authoredLessons: number; levels: Array<{ level: string; steps: number }> };

const entries = curriculum.lessons as CurriculumEntry[];
const DEPTHS: Record<PathDifficulty, readonly CurriculumEntry["depth"][]> = {
  easy: ["core"],
  medium: ["core", "standard"],
  hard: ["core", "standard", "deep"],
};

/** Derive path sizes from the curriculum source of truth, not a copied number in UI code. */
export function coursePathCounts(authoredLessons: number): PathCounts[] {
  return (Object.keys(DEPTHS) as PathDifficulty[]).map((difficulty) => {
    const selected = entries.filter((entry) => DEPTHS[difficulty].includes(entry.depth));
    const levels = [...new Set(selected.map((entry) => entry.level))].map((level) => ({
      level,
      steps: selected.filter((entry) => entry.level === level).length,
    }));
    return {
      difficulty,
      steps: selected.length,
      lessons: selected.filter((entry) => entry.kind === "lesson").length,
      scenarios: selected.filter((entry) => entry.kind === "scenario").length,
      checkpoints: selected.filter((entry) => entry.kind === "checkpoint").length,
      authoredLessons,
      levels,
    };
  });
}
