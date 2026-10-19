import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

// Captures the real rendered build for review without installing anything: CI uploads
// these images as the `app-screenshots` artifact on every run (see the e2e job).
const OUT = path.join(process.cwd(), "e2e-screenshots");
const SHOTS: Array<{ name: string; path: string }> = [
  { name: "catalogue-en", path: "/en" },
  { name: "lesson-en", path: "/en/learn/unit.syntax.v2_declarative.a1" },
  { name: "catalogue-ar-rtl", path: "/ar" },
  { name: "lesson-uk", path: "/uk/learn/unit.syntax.v2_declarative.a1" },
];

test.beforeAll(() => mkdirSync(OUT, { recursive: true }));

for (const shot of SHOTS) {
  test(`screenshot ${shot.name}`, async ({ page }, testInfo) => {
    await page.goto(shot.path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.screenshot({ path: path.join(OUT, `${shot.name}-${testInfo.project.name}.png`), fullPage: true });
  });
}

test("screenshot lesson after a wrong answer", async ({ page }, testInfo) => {
  await page.goto("/en/learn/unit.syntax.v2_declarative.a1");
  const exercise = page.locator("section.exercise").first();
  await exercise.getByRole("radio", { name: "Heute ich habe frei." }).check();
  await exercise.getByRole("button", { name: "Check", exact: true }).click();
  await expect(exercise.locator(".feedback.bad")).toBeVisible();
  await page.screenshot({ path: path.join(OUT, `lesson-feedback-${testInfo.project.name}.png`), fullPage: true });
});
