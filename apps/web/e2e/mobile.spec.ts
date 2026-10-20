import { expect, test } from "@playwright/test";

const LESSON = "/en/learn/unit.syntax.v2_declarative.a1";

/** The smallest phone we design for: a 320px screen with the same 16px gutter. */
test.describe("narrowest supported phone", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const path of ["/en", LESSON]) {
    test(`no sideways scroll at 320px on ${path}`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "content is wider than a 320px screen").toBeLessThanOrEqual(0);
    });
  }
});

/** Every control a learner taps is at least 44px tall (the project rule for interactive controls). */
test.describe("tap targets on a lesson", () => {
  test("buttons, answer options and gap fields are at least 44px tall", async ({ page }) => {
    await page.goto(LESSON);
    const controls = page.locator("main button:visible, main .option:visible, main input.gap:visible, main input.free:visible");
    const count = await controls.count();
    expect(count, "the lesson should have tappable controls").toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const box = await controls.nth(i).boundingBox();
      expect(box?.height ?? 0, `control ${i} is too short to tap`).toBeGreaterThanOrEqual(44);
    }
  });

  test("the language picker targets are at least 44px tall", async ({ page }) => {
    await page.goto(LESSON);
    const links = page.getByRole("navigation", { name: "Explanation language" }).getByRole("link");
    const count = await links.count();
    expect(count).toBeGreaterThan(1);
    for (let i = 0; i < count; i++) {
      const box = await links.nth(i).boundingBox();
      expect(box?.height ?? 0, `language link ${i}`).toBeGreaterThanOrEqual(44);
    }
  });

  test("the lesson summary ends above the bottom tab bar", async ({ page }) => {
    await page.goto(LESSON);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const bar = await page.locator("nav.tabbar").boundingBox();
    const summary = await page.locator("section.summary").boundingBox();
    expect(bar, "the tab bar should be on screen").not.toBeNull();
    expect(summary, "the lesson should end with a summary").not.toBeNull();
    expect(summary!.y + summary!.height).toBeLessThanOrEqual(bar!.y + 1);
  });
});

// Phone width with the 16px gutter from the design spec: no sideways scrolling.
test.describe("phone layout", () => {
  for (const path of ["/en", "/en/learn/unit.syntax.v2_declarative.a1", "/ar/learn/unit.syntax.v2_declarative.a1"]) {
    test(`no horizontal scroll on ${path}`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "page is wider than the viewport").toBeLessThanOrEqual(0);
    });
  }
});

/** On a phone the sections live in the bottom bar, not in the header. */
test.describe("phone navigation", () => {
  test("the bottom tab bar navigates between sections", async ({ page }) => {
    await page.goto("/en");
    const tabs = page.getByRole("navigation", { name: "App sections" });
    await expect(tabs).toBeVisible();
    // Every section of the app is reachable from the bottom bar.
    await expect(tabs.getByRole("link")).toHaveCount(4);
    // The header navigation is hidden at this width, so there is one set of links.
    await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
    await tabs.getByRole("link", { name: "Knowledge map" }).click();
    await expect(page).toHaveURL(/\/en\/map$/);
    await expect(tabs.getByRole("link", { name: "Knowledge map" })).toHaveAttribute("aria-current", "page");
  });

  test("the bottom bar does not cover the end of the page", async ({ page }) => {
    await page.goto("/en");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const bar = await page.locator("nav.tabbar").boundingBox();
    const last = await page.locator("main .route li").last().boundingBox();
    expect(bar, "the tab bar should be on screen").not.toBeNull();
    expect(last, "the last route step should be reachable").not.toBeNull();
    expect(last!.y + last!.height).toBeLessThanOrEqual(bar!.y + 1);
  });
});
