import { strict as assert } from "node:assert";
import { it } from "node:test";
import { refreshBrowserSession } from "../lib/auth/browser-refresh.ts";

it("posts to the refresh route and accepts only a successful token rotation", async () => {
  let seen: { input: RequestInfo | URL; init?: RequestInit } | undefined;
  const refreshed = await refreshBrowserSession(async (input, init) => {
    seen = { input, init };
    return new Response(null, { status: 204 });
  });

  assert.equal(refreshed, true);
  assert.equal(seen?.input, "/auth/refresh");
  assert.equal(seen?.init?.method, "POST");
  assert.equal(seen?.init?.cache, "no-store");
});

it("treats an unavailable or refused refresh as unsigned without throwing", async () => {
  assert.equal(await refreshBrowserSession(async () => new Response(null, { status: 401 })), false);
  assert.equal(await refreshBrowserSession(async () => { throw new TypeError("offline"); }), false);
});

it("coalesces simultaneous refresh requests so a rotating token is exchanged once", async () => {
  let calls = 0;
  let finish: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => { finish = resolve; });
  const fetchImpl = (async () => {
    calls += 1;
    await gate;
    return new Response(null, { status: 204 });
  }) as typeof fetch;

  const first = refreshBrowserSession(fetchImpl);
  const second = refreshBrowserSession(fetchImpl);
  assert.equal(calls, 1);
  finish?.();
  assert.deepEqual(await Promise.all([first, second]), [true, true]);
});
