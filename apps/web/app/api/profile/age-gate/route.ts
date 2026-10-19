/**
 * POST /api/profile/age-gate — records the learner's 16+ assertion.
 * Thin adapter; the rules and status codes live in lib/profile/age-gate.ts and are tested there.
 */
import { ageGateStore } from "../../../../lib/data/profile-store.ts";
import { isConfigured } from "../../../../lib/data/pg.ts";
import { handleAgeGate } from "../../../../lib/profile/age-gate.ts";
import { sessionFrom } from "../../../../lib/auth/session.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function POST(request: Request): Promise<Response> {
  return handleAgeGate(request, {
    storeFor: (userId) => (isConfigured() ? ageGateStore(userId) : null),
    session: (req) => sessionFrom(req, process.env.SUPABASE_JWT_SECRET, Math.floor(Date.now() / 1000)),
  });
}
