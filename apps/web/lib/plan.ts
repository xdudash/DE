/**
 * The learner's plan on this device: why they learn German and how much time a day they
 * have (DG-029, ADR-0017 Q4). The course teaches general German first; no country or
 * region is chosen (ADR-0020).
 *
 * Goals use the same names as the profile enum in supabase/migrations/0001. The first
 * device version used "life"; it is read as "everyday".
 */
export const GOALS = ["general", "everyday", "work", "study", "exam"] as const;
export type Goal = (typeof GOALS)[number];

export const MINUTE_CHOICES: readonly number[] = [5, 10, 15, 20];
export const PATH_DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type PathDifficulty = (typeof PATH_DIFFICULTIES)[number];

export interface Setup {
  goal: Goal;
  minutes: number;
  difficulty: PathDifficulty;
}

const LEGACY_GOAL: Readonly<Record<string, Goal>> = { life: "everyday" };

function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}

/**
 * Validates a stored plan. Returns null for anything that is not a complete, valid plan, so
 * the form shows "no plan" rather than a half-valid one. A region saved by an earlier
 * version is ignored.
 */
export function normalizeSetup(raw: unknown): Setup | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const goal = typeof record.goal === "string" ? (LEGACY_GOAL[record.goal] ?? record.goal) : undefined;
  if (!isOneOf(GOALS, goal)) return null;
  if (typeof record.minutes !== "number" || !MINUTE_CHOICES.includes(record.minutes)) return null;
  // Existing learners without this field keep a valid plan and start on the balanced path.
  const difficulty = isOneOf(PATH_DIFFICULTIES, record.difficulty) ? record.difficulty : "medium";
  return { goal, minutes: record.minutes, difficulty };
}
