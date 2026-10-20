import { expect, test } from "@playwright/test";

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
