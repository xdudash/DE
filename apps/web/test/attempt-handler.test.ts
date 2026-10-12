import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { MemoryStore } from "@deutschgo/attempts";
import { AuthNotConfigured, TokenInvalid } from "../lib/auth/session.ts";
import { handleAttempt, type HandlerDeps } from "../lib/attempts/handler.ts";
import { T0, UNIT, UNIT_VERSION, bundle, request as attemptBody } from "../../../packages/attempts/test/fixtures.ts";

const USER = "11111111-1111-4111-8111-111111111111";

function deps(over: Partial<HandlerDeps> = {}, store = new MemoryStore()): HandlerDeps & { store: MemoryStore } {
  return {
    bundle,
    storeFor: () => store,
    session: () => ({ userId: USER }),
    now: () => T0,
    store,
    ...over,
  };
}

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("https://deutschgo.test/api/attempts", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("POST /api/attempts", () => {
  it("records a correct answer and answers 201 with the server's verdict", async () => {
    const d = deps();
    const res = await handleAttempt(post(attemptBody()), d);
    assert.equal(res.status, 201);
    assert.equal(res.headers.get("cache-control"), "no-store");
    const body = await res.json();
    assert.equal(body.correct, true);
    assert.equal(body.recorded, true);
    assert.equal(body.states[0].state, "in_progress");
    assert.equal(d.store.events.size, 1);
  });

  it("answers 200 on a replay and stores one event", async () => {
    const d = deps();
    const body = attemptBody();
    await handleAttempt(post(body), d);
    const res = await handleAttempt(post(body), d);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).recorded, false);
    assert.equal(d.store.events.size, 1);
  });

  it("refuses anything but POST", async () => {
    const res = await handleAttempt(new Request("https://deutschgo.test/api/attempts"), deps());
    assert.equal(res.status, 405);
  });

  it("answers 401 without a session and stores nothing", async () => {
    const d = deps({ session: () => null });
    const res = await handleAttempt(post(attemptBody()), d);
    assert.equal(res.status, 401);
    assert.equal((await res.json()).error, "not_signed_in");
    assert.equal(d.store.events.size, 0);
  });

  it("answers 401 for a token that fails verification", async () => {
    const res = await handleAttempt(post(attemptBody()), deps({ session: () => { throw new TokenInvalid("signature does not match"); } }));
    assert.equal(res.status, 401);
    assert.equal((await res.json()).error, "invalid_token");
  });

  it("answers 503 when the deployment cannot verify sessions or store data", async () => {
    const noAuth = await handleAttempt(post(attemptBody()), deps({ session: () => { throw new AuthNotConfigured(); } }));
    assert.equal(noAuth.status, 503);
    assert.equal((await noAuth.json()).error, "auth_not_configured");
    const noDb = await handleAttempt(post(attemptBody()), deps({ storeFor: () => null }));
    assert.equal(noDb.status, 503);
    assert.equal((await noDb.json()).error, "storage_not_configured");
  });

  it("maps request problems to distinct statuses", async () => {
    const cases: [unknown, number, string][] = [
      ["{", 400, "malformed_request"],
      [{ ...attemptBody(), correct: true }, 400, "malformed_request"],
      [attemptBody({ unitId: "unit.syntax.nope.a1" }), 404, "unknown_content"],
      [attemptBody({ exerciseId: "x_missing" }), 404, "unknown_content"],
      [attemptBody({ contentVersion: "0.9.0" }), 409, "version_mismatch"],
      [attemptBody({ response: { type: "single_choice", optionId: "b" } }), 422, "response_mismatch"],
    ];
    for (const [body, status, error] of cases) {
      const res = await handleAttempt(post(body), deps());
      assert.equal(res.status, status, `${error}: unexpected status`);
      assert.equal((await res.json()).error, error);
    }
  });

  it("tells the learner how to recover from a stale page", async () => {
    const res = await handleAttempt(post(attemptBody({ contentVersion: "0.9.0" })), deps());
    const body = await res.json();
    assert.match(body.message, new RegExp(UNIT_VERSION));
    assert.match(body.detail, /reload/);
    assert.match(body.message, new RegExp(UNIT.replace(/\./g, "\\.")));
  });
});
