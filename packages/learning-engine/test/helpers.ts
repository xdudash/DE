import { DAY_MS } from "../src/scheduler.ts";
import type { LearningEvent } from "../src/types.ts";

export const T0 = Date.UTC(2026, 9, 1, 8, 0, 0);
export const day = (n: number) => T0 + n * DAY_MS;
let seq = 0;
export function ev(kind: LearningEvent["kind"], at: number, concept: string, correct?: boolean, extra: Partial<LearningEvent> = {}): LearningEvent {
  const e: LearningEvent = { id: `e${String(++seq).padStart(4, "0")}`, kind, at, contentId: "unit.x.y.a1", conceptIds: [concept], skill: "knowledge", ...extra };
  if (correct !== undefined) e.correct = correct;
  return e;
}
