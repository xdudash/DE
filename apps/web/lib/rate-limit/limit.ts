/**
 * Applies a policy to one request: counts it, and answers 429 with Retry-After when the
 * subject is over the limit. Storage is a port, so the same logic runs against Postgres
 * (lib/data/rate-limit-store.ts) and against memory (tests, deployments without a database).
 *
 * Failure policy: if the counter store fails, the request is allowed and the failure is
 * logged. Refusing every learner because the counter table is missing would be worse than
 * the abuse it guards against, and the write itself still goes through the database.
 */
import { createHash } from "node:crypto";
import { bucketKey, decide, expiresAtMs, type Policy } from "./policy.ts";

export interface HitStore {
  /** Adds one hit to `key` and returns the hits in its window, including this one. */
  hit(key: string, expiresAtMs: number): Promise<number>;
}

/** Process-local counters: best effort, since serverless instances do not share memory. */
export function memoryHitStore(clock: () => number = Date.now): HitStore {
  const counters = new Map<string, { hits: number; expiresAt: number }>();
  let calls = 0;
  return {
    async hit(key, expiresAt) {
      const now = clock();
      if (++calls % 500 === 0) {
        for (const [k, v] of counters) if (v.expiresAt <= now) counters.delete(k);
      }
      const current = counters.get(key);
      if (current && current.expiresAt > now) {
        current.hits += 1;
        return current.hits;
      }
      counters.set(key, { hits: 1, expiresAt });
      return 1;
    },
  };
}

/** A subject is hashed before it is stored, so no raw address or user id reaches the table. */
export function subjectKey(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

/**
 * The client address for per-address limits. On Vercel the platform sets x-real-ip and
 * appends the connecting address to x-forwarded-for; the first entry of that header can
 * be supplied by the client, so the last one is used.
 */
export function clientIp(request: Request): string {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const chain = request.headers.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  return chain.at(-1) ?? "unknown";
}

export async function guard(store: HitStore, policy: Policy, subject: string, nowMs: number = Date.now()): Promise<Response | null> {
  let hits: number;
  try {
    hits = await store.hit(bucketKey(policy, subject, nowMs), expiresAtMs(policy, nowMs));
  } catch (err) {
    console.error(`rate limit "${policy.name}" unavailable; request allowed`, err);
    return null;
  }
  const decision = decide(policy, hits, nowMs);
  if (decision.allowed) return null;
  return Response.json(
    { error: "rate_limited", message: "too many requests; wait before trying again", retry_after: decision.retryAfterSeconds },
    {
      status: 429,
      headers: { "cache-control": "no-store", "retry-after": String(decision.retryAfterSeconds) },
    },
  );
}
