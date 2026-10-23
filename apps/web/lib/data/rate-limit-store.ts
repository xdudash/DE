/**
 * Postgres counters for lib/rate-limit (DG-027). Lives in lib/data because it opens a
 * database connection (ADR-0010); the counter table is written only by the service role.
 */
import "server-only";
import { isConfigured, withService } from "./pg.ts";
import { memoryHitStore, type HitStore } from "../rate-limit/limit.ts";

/** Deletes expired counters on about one call in 100, so the table stays small. */
const CLEANUP_EVERY = 100;

function postgresHitStore(): HitStore {
  let calls = 0;
  return {
    async hit(key, expiresAt) {
      return withService(async (c) => {
        const result = await c.query(
          `insert into public.rate_limits as r (key, hits, expires_at)
           values ($1, 1, to_timestamp($2::double precision / 1000))
           on conflict (key) do update set hits = r.hits + 1
           returning hits`,
          [key, expiresAt],
        );
        if (++calls % CLEANUP_EVERY === 0) {
          await c.query("delete from public.rate_limits where expires_at < now()");
        }
        const hits = Number(result.rows[0]?.hits);
        if (!Number.isFinite(hits)) throw new Error("rate limit store returned no count");
        return hits;
      });
    },
  };
}

let postgres: HitStore | undefined;
let memory: HitStore | undefined;

/** The counter store for this deployment: Postgres when a database is configured, else memory. */
export function rateLimitStore(): HitStore {
  if (isConfigured()) return (postgres ??= postgresHitStore());
  return (memory ??= memoryHitStore());
}
