/**
 * Browser side of attempt recording. The local evaluation already gave the learner
 * their feedback; this only tries to persist the attempt.
 *
 * Deliberate properties:
 *  - the event id is generated once per answer, shared with the device's own record of
 *    it, and reused on every retry (lib/attempts/outbox.ts), so a flaky network cannot
 *    create two events for one answer;
 *  - the client never sends its own verdict (the server re-evaluates);
 *  - "not signed in" is an expected answer, not an error to show as a failure.
 */
import type { Response } from "@deutschgo/content-kit/evaluate";

export type SubmitState =
  | { status: "off" }          // nothing to save against yet (no session / no storage)
  | { status: "saving" }
  | { status: "saved" }
  | { status: "failed"; reason: string }
  | { status: "queued" }      // not saved yet; this browser retries it (lib/attempts/outbox.ts)
  | { status: "stale" };       // the page is older than the published content

export interface SubmitInput {
  eventId: string;
  unitId: string;
  exerciseId: string;
  contentVersion: string;
  response: Response;
  /** When the learner answered; defaults to now. Retries send the original time. */
  occurredAt?: string;
}

export async function submitAttempt(input: SubmitInput, fetchImpl: typeof fetch = fetch): Promise<SubmitState> {
  let res: globalThis.Response;
  try {
    res = await fetchImpl("/api/attempts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...input, occurredAt: input.occurredAt ?? new Date().toISOString() }),
    });
  } catch {
    return { status: "failed", reason: "network" };
  }
  if (res.ok) return { status: "saved" };
  if (res.status === 401 || res.status === 503) return { status: "off" };
  if (res.status === 409) return { status: "stale" };
  return { status: "failed", reason: `http_${res.status}` };
}
