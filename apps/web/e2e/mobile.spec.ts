import { expect, test, type Page } from "@playwright/test";

const LESSON = "/en/learn/unit.syntax.v2_declarative.a1";

/** Reads past the explanation to the first exercise. */
async function toFirstExercise(page: Page) {
  for (let i = 0; i < 40 && !(await page.locator("section.exercise").count()); i++) {
    await page.locator("footer.flow-footer").getByRole("button", { name: /^(Continue|Finish)$/ }).click();
  }
  await expect(page.locator("section.exercise").first()).toBeVisible();
}

/** The smallest phone we design for: a 320px screen with the same 16px gutter. */
test.describe("narrowest supported phone", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const path of ["/en", "/en/me", LESSON]) {
    test(`no sideways scroll at 320px on ${path}`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "content is wider than a 320px screen").toBeLessThanOrEqual(0);
    });
  }

  test("no sideways scroll at 320px on an exercise", async ({ page }) => {
    await page.goto(LESSON);
    await toFirstExercise(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

/** Every control a learner taps is at least 44px tall (the project rule for interactive controls). */
test.describe("tap targets", () => {
  test("in a lesson: leave, answer options and the action are at least 44px tall", async ({ page }) => {
    await page.goto(LESSON);
    await toFirstExercise(page);
    const controls = page.locator(".flow button:visible, .flow .option:visible, .flow input.gap:visible, .flow input.free:visible, .flow-close");
    const count = await controls.count();
    expect(count, "the lesson should have tappable controls").toBeGreaterThan(2);
    for (let i = 0; i < count; i++) {
      const box = await controls.nth(i).boundingBox();
      expect(box?.height ?? 0, `control ${i} is too short to tap`).toBeGreaterThanOrEqual(44);
    }
  });

  test("the language choices in the learner area are at least 44px tall", async ({ page }) => {
    await page.goto("/en/me");
    const links = page.locator(".lang-list a");
    const count = await links.count();
    expect(count).toBeGreaterThan(1);
    for (let i = 0; i < count; i++) {
      const box = await links.nth(i).boundingBox();
      expect(box?.height ?? 0, `language link ${i}`).toBeGreaterThanOrEqual(44);
    }
  });

  test("the plan choices and the sound switch are at least 44px tall", async ({ page }) => {
    await page.goto("/en/me");
    const choices = page.locator(".choice");
    for (let i = 0; i < (await choices.count()); i++) {
      expect((await choices.nth(i).boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe("lesson mode on a phone", () => {
  test("the tab bar steps aside and the action stays on screen", async ({ page }) => {
    await page.goto(LESSON);
    await expect(page.locator("nav.tabbar")).toBeHidden();
    const button = await page.locator("footer.flow-footer button").boundingBox();
    const viewport = page.viewportSize()!;
    expect(button, "the action button should be on screen").not.toBeNull();
    expect(button!.y + button!.height).toBeLessThanOrEqual(viewport.height);
  });
});

// Phone width with the 16px gutter from the design spec: no sideways scrolling.
test.describe("phone layout", () => {
  for (const path of ["/en", LESSON, "/ar/learn/unit.syntax.v2_declarative.a1", "/en/map", "/en/practice"]) {
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
    // The navigation column is hidden at this width, so there is one set of links.
    await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
    await tabs.getByRole("link", { name: "Knowledge map" }).click();
    await expect(page).toHaveURL(/\/en\/map$/);
    await expect(tabs.getByRole("link", { name: "Knowledge map" })).toHaveAttribute("aria-current", "page");
  });

  test("the top bar shows streak, XP and hearts", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("list", { name: "Your learning progress" })).toBeVisible();
  });

  test("the bottom bar does not cover the end of the page", async ({ page }) => {
    await page.goto("/en");
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    const bar = await page.locator("nav.tabbar").boundingBox();
    const last = await page.locator("main .footnote").boundingBox();
    expect(bar, "the tab bar should be on screen").not.toBeNull();
    expect(last, "the end of the page should be reachable").not.toBeNull();
    expect(last!.y + last!.height).toBeLessThanOrEqual(bar!.y + 1);
  });
});
