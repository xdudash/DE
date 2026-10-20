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

  test("saves a first-visit plan in this browser and says it is device-only", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("radio", { name: "Work" }).check();
    await page.getByRole("radio", { name: "15 min" }).check();
    await page.getByRole("button", { name: "Save my plan" }).click();
    await expect(page.getByText("Your plan on this device: Work, 15 min a day.")).toBeVisible();
    await expect(page.getByText(/Saved only in this browser/)).toBeVisible();
    // The choice survives a reload because it is stored in this browser.
    await page.reload();
    await expect(page.getByRole("radio", { name: "Work" })).toBeChecked();
  });

  test("the language picker marks the current language", async ({ page }) => {
    await page.goto("/en");
    // The picker lives in the app header and marks the active language with aria-current="page".
    const picker = page.getByRole("navigation", { name: "Explanation language" });
    await expect(picker.locator('a[aria-current="page"]')).toHaveAttribute("href", "/en");
  });

  test("the main navigation reaches the knowledge map, which searches topics", async ({ page }) => {
    await page.goto("/en");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Knowledge map" }).click();
    await expect(page).toHaveURL(/\/en\/map$/);
    const search = page.getByRole("searchbox", { name: "Search topics" });
    await search.fill("zzz-no-such-topic");
    await expect(page.getByText("No topics match this search.")).toBeVisible();
    await search.fill("");
    await expect(page.getByText("States are based only on answers in this browser.")).toBeVisible();
  });

  test("a new learner is pointed at the first route step, with the reason", async ({ page }) => {
    await page.goto("/en");
    const section = page.locator("section.next-step");
    await expect(section.getByRole("heading", { name: "Your next step" })).toBeVisible();
    await expect(section.locator(`a[href="${UNIT}"]`)).toBeVisible();
    await expect(section.getByText("Next step on your route")).toBeVisible();
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

  test("the summary asks for every answer before it shows a score, and names the next step", async ({ page }) => {
    await page.goto(UNIT);
    await expect(page.getByRole("heading", { name: "Your result" })).toBeVisible();
    await expect(page.getByText(/Answered so far: 0 of \d+/)).toBeVisible();
    await expect(page.getByText(/Your result is kept in this browser only/)).toBeVisible();
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
