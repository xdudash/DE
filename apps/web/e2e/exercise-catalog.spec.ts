import { expect, test } from "@playwright/test";

test.describe("exercise format gallery on desktop", () => {
  test("shows working pair and category interactions without desktop overflow", async ({ page }) => {
    await page.setViewportSize({ width: 1365, height: 900 });
    await page.goto("/en/exercises");

    const pairs = page.locator(".catalog-format").filter({ hasText: "Match pairs" });
    await pairs.getByRole("button", { name: "Preview interaction" }).click();
    await pairs.getByRole("button", { name: "Guten Morgen" }).click();
    await pairs.getByRole("button", { name: "Good morning" }).click();
    await pairs.getByRole("button", { name: "Gute Nacht" }).click();
    await pairs.getByRole("button", { name: "Good night" }).click();
    await pairs.getByRole("button", { name: "Check answer" }).click();
    await expect(pairs.getByRole("status")).toContainText("Correct");

    const categories = page.locator(".catalog-format").filter({ hasText: "Categorize" });
    await categories.getByRole("button", { name: "Preview interaction" }).click();
    await categories.locator("select").nth(0).selectOption("Obst");
    await categories.locator("select").nth(1).selectOption("Möbel");
    await categories.locator("select").nth(2).selectOption("Getränk");
    await categories.getByRole("button", { name: "Check answer" }).click();
    await expect(categories.getByRole("status")).toContainText("Correct");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});
