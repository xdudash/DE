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
