import { expect, test } from "@playwright/test";

const UNIT = "/en/learn/unit.syntax.v2_declarative.a1";

/**
 * Installability and the offline promise (ADR-0012). These run against the
 * production build, which is the only build that registers the worker.
 */
test.describe("installable app", () => {
  test("serves a manifest with the fields a browser needs to offer installation", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.status()).toBe(200);
    const manifest = await response.json();
    expect(manifest.name).toBe("DeutschGo");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    expect(manifest.icons.some((i: { purpose: string }) => i.purpose === "maskable")).toBe(true);
  });

  test("every icon the manifest names is actually served", async ({ request }) => {
    const manifest = await (await request.get("/manifest.webmanifest")).json();
    const paths = [...manifest.icons.map((i: { src: string }) => i.src), "/icons/apple-touch-icon.png"];
    for (const path of paths) {
      const response = await request.get(path);
      expect(response.status(), `${path} is missing`).toBe(200);
      expect(response.headers()["content-type"]).toContain("image/png");
    }
  });

  test("the page links the manifest and the Apple touch icon", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  });
});

test.describe("offline", () => {
  test("registers a service worker that takes control of the page", async ({ page }) => {
    await page.goto("/en");
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, { timeout: 15_000 });
    expect(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toContain("/sw.js");
  });

  test("a lesson that was opened online stays readable with no connection", async ({ page, context }) => {
    await page.goto(UNIT);
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, { timeout: 15_000 });
    // The first visit happened before the worker took control, so load it once more
    // while online: that response is what the cache keeps.
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await context.setOffline(true);
    try {
      await page.reload();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      // German is still there: the cached page is the lesson, not a shell.
      expect(await page.locator('[lang="de"]').count()).toBeGreaterThan(0);
    } finally {
      await context.setOffline(false);
    }
  });

  test("a page that was never opened falls back to an honest offline page", async ({ page, context }) => {
    await page.goto("/en");
    await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, null, { timeout: 15_000 });
    await context.setOffline(true);
    try {
      await page.goto("/en/map");
      await expect(page.getByRole("heading", { name: "No connection" })).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });
});
