/**
 * Fixed-window request limits for write endpoints (DG-027, ADR-0017 Q7).
 *
 * Pure functions: no clock, no database. The caller passes `nowMs`, so every window and
 * retry time is deterministic in tests. The limits are generous on purpose: a learner
 * working at a normal pace must never see them (ADR-0017, DATA_AND_PRIVACY).
 */
export interface Policy {
  readonly name: string;
  /** Requests allowed per subject in one window. */
  readonly limit: number;
  readonly windowSeconds: number;
}

export const POLICY: Record<"attempts" | "pushSubscribe" | "authStart" | "authTest", Policy> = {
  /** One exercise answer every few seconds is far below this; a fast lesson is ~30 answers. */
  attempts: { name: "attempts", limit: 120, windowSeconds: 60 },
  pushSubscribe: { name: "push_subscribe", limit: 20, windowSeconds: 60 },
  /** Sign-in starts per client address. */
  authStart: { name: "auth_start", limit: 30, windowSeconds: 60 },
  /** Throwaway test accounts (preview only) per client address. */
  authTest: { name: "auth_test", limit: 5, windowSeconds: 3600 },
};

export function windowStartMs(nowMs: number, windowSeconds: number): number {
  const size = windowSeconds * 1000;
  return Math.floor(nowMs / size) * size;
}

/** Key of one subject's counter in one window. The subject must already be hashed. */
export function bucketKey(policy: Policy, subject: string, nowMs: number): string {
  return `${policy.name}:${subject}:${windowStartMs(nowMs, policy.windowSeconds)}`;
}

/** A counter may be deleted once its window has ended, with a minute of slack for clock skew. */
export function expiresAtMs(policy: Policy, nowMs: number): number {
  return windowStartMs(nowMs, policy.windowSeconds) + policy.windowSeconds * 1000 + 60_000;
}

export interface Decision {
  readonly allowed: boolean;
  readonly hits: number;
  readonly retryAfterSeconds: number;
}

/** Requests up to the limit pass; the first one over it is refused until the window ends. */
export function decide(policy: Policy, hits: number, nowMs: number): Decision {
  if (hits <= policy.limit) return { allowed: true, hits, retryAfterSeconds: 0 };
  const windowEnd = windowStartMs(nowMs, policy.windowSeconds) + policy.windowSeconds * 1000;
  return { allowed: false, hits, retryAfterSeconds: Math.max(1, Math.ceil((windowEnd - nowMs) / 1000)) };
}
