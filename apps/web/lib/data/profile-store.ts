/**
 * PostgreSQL storage for the learner's age-gate assertion.
 * Written as the learner, so RLS (profiles_insert_own / profiles_update_own) decides.
 */
import "server-only";
import type { AgeGateStore } from "../profile/age-gate.ts";
import { withLearner } from "./pg.ts";

export function ageGateStore(userId: string): AgeGateStore {
  return {
    async confirmAge(id: string) {
      if (id !== userId) throw new Error("age assertion belongs to another learner");
      await withLearner(userId, (c) =>
        c.query(
          `insert into public.profiles (user_id, age_confirmed)
             values ($1, true)
           on conflict (user_id) do update set age_confirmed = true`,
          [userId],
        ),
      );
    },
  };
}
