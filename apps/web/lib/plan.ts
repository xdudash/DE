/**
 * The learner's plan on this device: why they learn German, where they will use it, and
 * how much time a day they have (DG-029, ADR-0017 Q4).
 *
 * Goals and regions use the same names as the profile enums in supabase/migrations/0001,
 * so a later sync needs no mapping. The first device version used "life"; it is read as
 * "everyday" and written back as "everyday" when the learner saves again.
 */
export const GOALS = ["general", "everyday", "work", "study", "exam"] as const;
export type Goal = (typeof GOALS)[number];

export const REGIONS = ["standard", "de-DE", "de-AT", "de-CH"] as const;
export type Region = (typeof REGIONS)[number];

export const MINUTE_CHOICES: readonly number[] = [5, 10, 15, 20];

export interface Setup {
  goal: Goal;
  region: Region;
  minutes: number;
}

const LEGACY_GOAL: Readonly<Record<string, Goal>> = { life: "everyday" };

function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}

/**
 * Validates a stored plan. Returns null for anything that is not a complete plan, so the
 * form shows "no plan" rather than a half-valid one. A plan saved before regions existed
 * has no region and means "standard".
 */
export function normalizeSetup(raw: unknown): Setup | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const goal = typeof record.goal === "string" ? (LEGACY_GOAL[record.goal] ?? record.goal) : undefined;
  if (!isOneOf(GOALS, goal)) return null;
  const region = record.region === undefined ? "standard" : record.region;
  if (!isOneOf(REGIONS, region)) return null;
  if (typeof record.minutes !== "number" || !MINUTE_CHOICES.includes(record.minutes)) return null;
  return { goal, region, minutes: record.minutes };
}
