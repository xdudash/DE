import { strict as assert } from "node:assert";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import { handleAgeGate, isOver16Assertion, type AgeGateDeps, type AgeGateStore } from "../lib/profile/age-gate.ts";
import { AuthNotConfigured, sessionFrom } from "../lib/auth/session.ts";

const SECRET = "test-secret";
const NOW = 1_800_000_000;
const USER = "11111111-1111-4111-8111-111111111111";

function token(payload: object, secret = SECRET): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64(payload);
  const sig = createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}

class RecordingStore implements AgeGateStore {
  calls: string[] = [];
  async confirmAge(userId: string): Promise<void> {
    this.calls.push(userId);
  }
}

function deps(over: Partial<AgeGateDeps> = {}, store: AgeGateStore | null = new RecordingStore()): AgeGateDeps {
  return {
    storeFor: () => store,
    // The real session resolver, so the token path is exercised end to end.
    session: (req) => sessionFrom(req, SECRET, NOW),
    ...over,
  };
}

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("https://deutschgo.test/api/profile/age-gate", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const signedIn = { authorization: `Bearer ${token({ sub: USER, role: "authenticated", exp: NOW + 3600 })}` };

describe("isOver16Assertion", () => {
  it("accepts exactly { over16: true }", () => {
    assert.equal(isOver16Assertion({ over16: true }), true);
  });
  it("refuses false, missing, truthy-but-not-true, extra fields, arrays and null", () => {
    for (const bad of [{ over16: false }, {}, { over16: "true" }, { over16: 1 }, { over16: true, birthYear: 1990 }, [], null, "true"]) {
      assert.equal(isOver16Assertion(bad), false, JSON.stringify(bad));
    }
  });
});

describe("POST /api/profile/age-gate", () => {
  it("records the assertion for the signed-in learner and answers 200", async () => {
    const store = new RecordingStore();
    const res = await handleAgeGate(post({ over16: true }, signedIn), deps({}, store));
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ageConfirmed: true });
    assert.deepEqual(store.calls, [USER], "stored under the token's subject, never a client-supplied id");
  });

  it("answers 405 for any method other than POST", async () => {
    const res = await handleAgeGate(new Request("https://deutschgo.test/api/profile/age-gate", { method: "GET" }), deps());
    assert.equal(res.status, 405);
  });

  it("answers 401 without credentials and does not write", async () => {
    const store = new RecordingStore();
    const res = await handleAgeGate(post({ over16: true }), deps({}, store));
    assert.equal(res.status, 401);
    assert.equal((await res.json()).error, "not_signed_in");
    assert.equal(store.calls.length, 0);
  });

  it("answers 401 for a token signed with another secret, never downgrading to anonymous", async () => {
    const forged = { authorization: `Bearer ${token({ sub: USER, role: "authenticated", exp: NOW + 3600 }, "other")}` };
    const store = new RecordingStore();
    const res = await handleAgeGate(post({ over16: true }, forged), deps({}, store));
    assert.equal(res.status, 401);
    assert.equal((await res.json()).error, "invalid_token");
    assert.equal(store.calls.length, 0);
  });

  it("answers 503 when the deployment has no auth secret", async () => {
    const res = await handleAgeGate(post({ over16: true }, signedIn), deps({ session: () => { throw new AuthNotConfigured(); } }));
    assert.equal(res.status, 503);
  });

  it("answers 503 when the deployment has no database, rather than pretending to save", async () => {
    const res = await handleAgeGate(post({ over16: true }, signedIn), deps({}, null));
    assert.equal(res.status, 503);
    assert.equal((await res.json()).error, "database_not_configured");
  });

  it("answers 400 for malformed JSON", async () => {
    const res = await handleAgeGate(post("{not json", signedIn), deps());
    assert.equal(res.status, 400);
  });

  it("answers 422 for a refused or ambiguous assertion and writes nothing", async () => {
    for (const body of [{ over16: false }, {}, { over16: true, dob: "1990-01-01" }]) {
      const store = new RecordingStore();
      const res = await handleAgeGate(post(body, signedIn), deps({}, store));
      assert.equal(res.status, 422, JSON.stringify(body));
      assert.equal(store.calls.length, 0, JSON.stringify(body));
    }
  });

  it("propagates a failed write instead of answering success", async () => {
    const failing: AgeGateStore = { confirmAge: async () => { throw new Error("connection reset"); } };
    await assert.rejects(handleAgeGate(post({ over16: true }, signedIn), deps({}, failing)), /connection reset/);
  });
});
