import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { MemoryStore } from "@deutschgo/attempts";
import { AuthNotConfigured, TokenInvalid } from "../lib/auth/session.ts";
import { handleGetProgress, handleImportProgress, type ProgressHandlerDeps } from "../lib/progress/handler.ts";
import { T0, bundle, request as attemptBody } from "../../../packages/attempts/test/fixtures.ts";

const USER = "11111111-1111-4111-8111-111111111111";
const deps = (over: Partial<ProgressHandlerDeps> = {}, store = new MemoryStore()) => ({
  bundle,
  storeFor: () => store,
  session: () => ({ userId: USER }),
  now: () => T0,
  store,
  ...over,
});
const request = (method: string, body?: unknown) => new Request("https://deutschgo.test/api/progress", {
  method,
  ...(body === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
});

describe("GET /api/progress", () => {
  it("returns account events without caching them", async () => {
    const d = deps();
    const imported = await handleImportProgress(request("POST", { attempts: [attemptBody()] }), d);
    assert.equal(imported.status, 200);
    const response = await handleGetProgress(request("GET"), d);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal((await response.json()).events.length, 1);
  });

  it("requires a verified session and configured storage", async () => {
    assert.equal((await handleGetProgress(request("GET"), deps({ session: () => null }))).status, 401);
    assert.equal((await handleGetProgress(request("GET"), deps({ session: () => { throw new TokenInvalid("bad"); } }))).status, 401);
    assert.equal((await handleGetProgress(request("GET"), deps({ session: () => { throw new AuthNotConfigured(); } }))).status, 503);
    assert.equal((await handleGetProgress(request("GET"), deps({ storeFor: () => null }))).status, 503);
  });

  it("refuses non-GET methods", async () => {
    assert.equal((await handleGetProgress(request("POST"), deps())).status, 405);
  });
});

describe("POST /api/progress/import", () => {
  it("re-evaluates and inserts an idempotent batch", async () => {
    const d = deps();
    const item = attemptBody();
    const response = await handleImportProgress(request("POST", { attempts: [item, item] }), d);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual({ imported: body.imported, duplicates: body.duplicates }, { imported: 1, duplicates: 1 });
    assert.equal(body.states.length, 1);
    assert.equal(d.store.events.size, 1);
  });

  it("rejects a mixed-validity batch before writing any event", async () => {
    const d = deps();
    const invalid = { ...attemptBody(), eventId: "00000000-0000-4000-8000-000000000999", correct: true };
    const response = await handleImportProgress(request("POST", { attempts: [attemptBody(), invalid] }), d);
    assert.equal(response.status, 400);
    assert.equal(d.store.events.size, 0);
    assert.equal(d.store.states.size, 0);
  });

  it("validates shape and batch size before parsing answers", async () => {
    const empty = await handleImportProgress(request("POST", { attempts: [] }), deps());
    const tooLarge = await handleImportProgress(request("POST", { attempts: Array.from({ length: 2_001 }, () => ({})) }), deps());
    const invalidJson = await handleImportProgress(new Request("https://deutschgo.test/api/progress/import", { method: "POST", body: "{" }), deps());
    assert.equal(empty.status, 400);
    assert.equal(tooLarge.status, 400);
    assert.equal(invalidJson.status, 400);
  });

  it("requires sign-in and applies the learner write limit", async () => {
    const noSession = await handleImportProgress(request("POST", { attempts: [attemptBody()] }), deps({ session: () => null }));
    const limited = await handleImportProgress(request("POST", { attempts: [attemptBody()] }), deps({
      limit: async () => Response.json({ error: "rate_limited" }, { status: 429 }),
    }));
    assert.equal(noSession.status, 401);
    assert.equal(limited.status, 429);
  });
});
