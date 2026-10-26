import "server-only";
import curriculum from "../../../curriculum/course.json";
import type { PathDifficulty } from "./plan";

type CurriculumEntry = { id: string; level: string; block: string; depth: "core" | "standard" | "deep"; kind: "lesson" | "scenario" | "checkpoint" };
type PathCounts = { difficulty: PathDifficulty; steps: number; lessons: number; scenarios: number; checkpoints: number; authoredLessons: number; levels: Array<{ level: string; steps: number }> };
export type CourseRoadmapBlock = { id: string; steps: number; lessons: number; scenarios: number; checkpoints: number };
export type CourseRoadmapLevel = { level: string; steps: number; blocks: CourseRoadmapBlock[] };

const entries = curriculum.lessons as CurriculumEntry[];
const DEPTHS: Record<PathDifficulty, readonly CurriculumEntry["depth"][]> = {
  easy: ["core"],
  medium: ["core", "standard"],
  hard: ["core", "standard", "deep"],
};
const LEVEL_ORDER = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];

function countsFor(selected: CurriculumEntry[]) {
  return {
    steps: selected.length,
    lessons: selected.filter((entry) => entry.kind === "lesson").length,
    scenarios: selected.filter((entry) => entry.kind === "scenario").length,
    checkpoints: selected.filter((entry) => entry.kind === "checkpoint").length,
  };
}

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
      ...countsFor(selected),
      authoredLessons,
      levels,
    };
  });
}

/** Group only the selected depth's blueprint into levels and blocks for the route board. */
export function courseRoadmap(difficulty: PathDifficulty): CourseRoadmapLevel[] {
  const selected = entries.filter((entry) => DEPTHS[difficulty].includes(entry.depth));
  const levelIds = [...new Set(selected.map((entry) => entry.level))].sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));
  return levelIds.map((level) => {
    const levelEntries = selected.filter((entry) => entry.level === level);
    const blockIds = [...new Set(levelEntries.map((entry) => entry.block))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return {
      level,
      ...countsFor(levelEntries),
      blocks: blockIds.map((id) => ({ id, ...countsFor(levelEntries.filter((entry) => entry.block === id)) })),
    };
  });
}
