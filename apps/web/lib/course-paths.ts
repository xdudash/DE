import "server-only";
import curriculum from "../../../curriculum/course.json";
import type { PathDifficulty } from "./plan";

type CurriculumEntry = { id: string; level: string; block: string; topic: string; depth: "core" | "standard" | "deep"; kind: "lesson" | "scenario" | "checkpoint" };
type PathCounts = { difficulty: PathDifficulty; steps: number; lessons: number; scenarios: number; checkpoints: number; authoredLessons: number; levels: Array<{ level: string; steps: number }> };
export type CourseRoadmapModule = { id: string; title: string; href: string; exerciseIds: string[] };
export type CourseRoadmapBlock = { id: string; steps: number; lessons: number; scenarios: number; checkpoints: number; topics: string[]; modules: CourseRoadmapModule[] };
export type CourseRoadmapLevel = { level: string; steps: number; blocks: CourseRoadmapBlock[] };

const entries = curriculum.lessons as CurriculumEntry[];
const DEPTHS: Record<PathDifficulty, readonly CurriculumEntry["depth"][]> = {
  easy: ["core"],
  medium: ["core", "standard"],
  hard: ["core", "standard", "deep"],
};
const LEVEL_ORDER = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];
export const CURRICULUM_TOPIC_BY_CONCEPT: Record<string, string[]> = {
  alphabet: ["alphabet"], umlauts: ["umlaute"], eszett_and_ss: ["eszett"],
  long_short_vowels: ["vowels_length"], greetings_dach: ["greetings"], goodbyes: ["goodbyes"],
  numbers_cardinal: ["numbers_0_20", "numbers_20_100"], verb_present_conjugation: ["present_regular", "present_irregular"],
  verb_modals: ["modal_koennen_muessen", "modal_wollen_moechten", "modal_duerfen_sollen"],
  verb_separable_prefix: ["separable_verbs"], imperative: ["imperative_sie"],
  v1_yes_no_questions: ["yes_no_questions"], w_questions: ["w_questions"], v2_declarative: ["present_regular"],
  case_accusative: ["nominativ_akkusativ"], pronoun_accusative: ["accusative_pronouns"],
};

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

/** Ordered, deduplicated authored lessons that a learner can actually open on this depth. */
export function courseSequence(difficulty: PathDifficulty, modulesByTopic: Record<string, CourseRoadmapModule[]> = {}): CourseRoadmapModule[] {
  const seen = new Set<string>();
  return entries.filter((entry) => entry.kind === "lesson" && DEPTHS[difficulty].includes(entry.depth))
    .flatMap((entry) => modulesByTopic[entry.topic] ?? [])
    .filter((module) => {
      if (seen.has(module.id)) return false;
      seen.add(module.id);
      return true;
    });
}

/** Group only the selected depth's blueprint into levels and blocks for the route board. */
export function courseRoadmap(difficulty: PathDifficulty, modulesByTopic: Record<string, CourseRoadmapModule[]> = {}): CourseRoadmapLevel[] {
  const selected = entries.filter((entry) => DEPTHS[difficulty].includes(entry.depth));
  const levelIds = [...new Set(selected.map((entry) => entry.level))].sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));
  return levelIds.map((level) => {
    const levelEntries = selected.filter((entry) => entry.level === level);
    const blockIds = [...new Set(levelEntries.map((entry) => entry.block))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return {
      level,
      ...countsFor(levelEntries),
      blocks: blockIds.map((id) => {
        const blockEntries = levelEntries.filter((entry) => entry.block === id);
        const topics = [...new Set(blockEntries.filter((entry) => entry.kind === "lesson").map((entry) => entry.topic))];
        const modules = [...new Map(topics.flatMap((topic) => modulesByTopic[topic] ?? []).map((module) => [module.id, module])).values()];
        return { id, ...countsFor(blockEntries), topics, modules };
      }),
    };
  });
}
