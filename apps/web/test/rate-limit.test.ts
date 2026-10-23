import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { POLICY, bucketKey, decide, expiresAtMs, windowStartMs, type Policy } from "../lib/rate-limit/policy.ts";
import { clientIp, guard, memoryHitStore, subjectKey, type HitStore } from "../lib/rate-limit/limit.ts";

const SMALL: Policy = { name: "test", limit: 3, windowSeconds: 60 };
const T0 = 1_000_000 * 60_000; // exactly on a window boundary

describe("fixed windows", () => {
  it("starts windows on whole multiples of the window length", () => {
    assert.equal(windowStartMs(T0 + 59_999, 60), T0);
    assert.equal(windowStartMs(T0 + 60_000, 60), T0 + 60_000);
  });

  it("keys one counter per subject and window", () => {
    assert.equal(bucketKey(SMALL, "a", T0), `test:a:${T0}`);
    assert.notEqual(bucketKey(SMALL, "a", T0), bucketKey(SMALL, "b", T0));
    assert.notEqual(bucketKey(SMALL, "a", T0), bucketKey(SMALL, "a", T0 + 60_000));
  });

  it("keeps a counter for one window plus slack, never less", () => {
    assert.equal(expiresAtMs(SMALL, T0), T0 + 60_000 + 60_000);
  });
});

describe("decide", () => {
  it("allows exactly up to the limit and refuses the next request", () => {
    assert.equal(decide(SMALL, 1, T0).allowed, true);
    assert.equal(decide(SMALL, 3, T0).allowed, true);
    assert.equal(decide(SMALL, 4, T0).allowed, false);
  });

  it("tells the client how long until the window ends, at least one second", () => {
    assert.equal(decide(SMALL, 4, T0).retryAfterSeconds, 60);
    assert.equal(decide(SMALL, 4, T0 + 59_000).retryAfterSeconds, 1);
    assert.equal(decide(SMALL, 4, T0 + 59_999).retryAfterSeconds, 1);
  });

  it("a new window starts again from zero", () => {
    assert.equal(decide(SMALL, 1, T0 + 60_000).allowed, true);
  });

  it("the production limits let a fast learner through", () => {
    // A fast lesson is about 30 answers; the attempts limit is per minute.
    assert.equal(decide(POLICY.attempts, 30, T0).allowed, true);
    assert.equal(decide(POLICY.attempts, 120, T0).allowed, true);
    assert.equal(decide(POLICY.attempts, 121, T0).allowed, false);
  });
});

describe("guard", () => {
  it("passes requests under the limit and answers 429 with Retry-After over it", async () => {
    const store = memoryHitStore(() => T0);
    assert.equal(await guard(store, SMALL, "a", T0), null);
    assert.equal(await guard(store, SMALL, "a", T0), null);
    assert.equal(await guard(store, SMALL, "a", T0), null);
    const refused = await guard(store, SMALL, "a", T0);
    if (refused === null) assert.fail("the fourth request must be refused");
    assert.equal(refused.status, 429);
    assert.equal(refused.headers.get("retry-after"), "60");
    assert.equal(refused.headers.get("cache-control"), "no-store");
    const body = await refused.json();
    assert.equal(body.error, "rate_limited");
    assert.equal(body.retry_after, 60);
  });

  it("counts each subject separately", async () => {
    const store = memoryHitStore(() => T0);
    for (let i = 0; i < 3; i++) await guard(store, SMALL, "a", T0);
    assert.equal(await guard(store, SMALL, "b", T0), null);
  });

  it("allows the request and logs when the counter store fails", async () => {
    const broken: HitStore = { hit: () => Promise.reject(new Error("db down")) };
    const logged: unknown[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => void logged.push(args);
    try {
      assert.equal(await guard(broken, SMALL, "a", T0), null);
    } finally {
      console.error = original;
    }
    assert.equal(logged.length, 1);
    assert.match(String(logged[0]), /test" unavailable/);
  });
});

describe("memory store", () => {
  it("resets a counter once its expiry has passed", async () => {
    let now = T0;
    const store = memoryHitStore(() => now);
    assert.equal(await store.hit("k", T0 + 1_000), 1);
    assert.equal(await store.hit("k", T0 + 1_000), 2);
    now = T0 + 2_000;
    assert.equal(await store.hit("k", T0 + 61_000), 1);
  });
});

describe("subjects and client addresses", () => {
  it("hashes subjects so no raw address or id is stored", () => {
    const hashed = subjectKey("203.0.113.9");
    assert.equal(hashed.length, 32);
    assert.ok(!hashed.includes("203.0.113.9"));
    assert.equal(subjectKey("203.0.113.9"), hashed);
  });

  it("prefers x-real-ip, then the last x-forwarded-for entry, never a client-supplied first one", () => {
    const real = new Request("https://x.test", { headers: { "x-real-ip": "198.51.100.7", "x-forwarded-for": "1.2.3.4, 198.51.100.7" } });
    assert.equal(clientIp(real), "198.51.100.7");
    const chain = new Request("https://x.test", { headers: { "x-forwarded-for": "6.6.6.6, 198.51.100.8" } });
    assert.equal(clientIp(chain), "198.51.100.8");
    assert.equal(clientIp(new Request("https://x.test")), "unknown");
  });
});
