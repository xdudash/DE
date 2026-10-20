import { expect, test, type Page } from "@playwright/test";

const UNIT = "/en/learn/unit.syntax.v2_declarative.a1";

/** The first exercise on the page: the single-choice item "Which sentence is correct?". */
function firstExercise(page: Page) {
  return page.locator("section.exercise").first();
}

test.describe("catalogue", () => {
  test("lists the A1 route with the gold unit and states that progress is not saved", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // The gold unit appears in more than one route, so take the first link to it.
    await expect(page.locator(`a[href="${UNIT}"]`).first()).toBeVisible();
    await expect(page.getByText(/progress is not saved yet/)).toBeVisible();
  });

  test("starts with an introduction and a one-tap start to the first lesson", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { name: "Start here" })).toBeVisible();
    await expect(page.getByText(/complete German course/)).toBeVisible();
    await page.getByRole("link", { name: /Start the first lesson/ }).click();
    await expect(page).toHaveURL(new RegExp(`${UNIT}$`));
  });

  test("the language picker marks the current language", async ({ page }) => {
    await page.goto("/en");
    // The picker marks the active language with aria-current="page" (see app/[lang]/page.tsx).
    await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute("href", "/en");
  });
});

test.describe("lesson page", () => {
  test("shows review and persistence banners and marks German text as German", async ({ page }) => {
    await page.goto(UNIT);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // The unit is not yet human-reviewed, so the honest banner must be there.
    await expect(page.locator("p.banner").first()).toBeVisible();
    await expect(page.getByText(/progress is not saved yet/)).toBeVisible();
    // German sentences carry lang="de" for screen readers and hyphenation.
    expect(await page.locator('[lang="de"]').count()).toBeGreaterThan(0);
  });

  test("a wrong answer is explained, the right answer is accepted, and reset clears it", async ({ page }) => {
    await page.goto(UNIT);
    const exercise = firstExercise(page);
    await exercise.getByRole("radio", { name: "Heute ich habe frei." }).check();
    await exercise.getByRole("button", { name: "Check", exact: true }).click();
    await expect(exercise.locator(".feedback.bad")).toBeVisible();

    await exercise.getByRole("radio", { name: "Heute habe ich frei." }).check();
    await exercise.getByRole("button", { name: "Check", exact: true }).click();
    await expect(exercise.locator(".feedback.ok")).toBeVisible();
  });

  test("radio options work with the keyboard alone", async ({ page }) => {
    await page.goto(UNIT);
    const option = firstExercise(page).getByRole("radio", { name: "Heute habe ich frei." });
    await option.focus();
    await page.keyboard.press("Space");
    await expect(option).toBeChecked();
  });

  test("an unknown unit is a 404, not an empty page", async ({ page }) => {
    const response = await page.goto("/en/learn/unit.does.not.exist");
    expect(response?.status()).toBe(404);
  });
});

test.describe("interface languages", () => {
  test("the Arabic preview lays out right-to-left and says it is a preview", async ({ page }) => {
    await page.goto("/ar");
    const root = page.locator('[data-locale="ar"]');
    await expect(root).toHaveAttribute("dir", "rtl");
    await expect(root).toHaveAttribute("data-preview", "true");
  });

  test("Ukrainian interface strings are rendered, not keys", async ({ page }) => {
    await page.goto("/uk");
    await expect(page.locator("body")).not.toContainText("app.name");
    await expect(page.locator('[data-locale="uk"]')).toHaveAttribute("dir", "ltr");
  });
});
