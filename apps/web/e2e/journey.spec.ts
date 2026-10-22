import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";

const UNIT = "/en/learn/unit.syntax.v2_declarative.a1";

/** The first exercise on screen: the single-choice item "Which sentence is correct?". */
function firstExercise(page: Page) {
  return page.locator("section.exercise").first();
}

/** The one action at the bottom of a lesson (Continue, Check or Finish). */
function action(page: Page, name: string | RegExp) {
  return page.locator("footer.flow-footer").getByRole("button", { name });
}

/** Moves through the lesson with "Continue" until the target is on screen. */
async function continueUntil(page: Page, target: Locator) {
  for (let i = 0; i < 40; i++) {
    if (await target.isVisible().catch(() => false)) return;
    await action(page, /^(Continue|Finish)$/).click();
  }
  await expect(target).toBeVisible();
}

test.describe("home: the line", () => {
  test("shows the route as a line with the written lesson and says progress is not saved", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(`a[href="${UNIT}"]`).first()).toBeVisible();
    await expect(page.getByText(/progress is not saved yet/)).toBeVisible();
  });

  test("marks where a new learner is, and opens that lesson in one tap", async ({ page }) => {
    await page.goto("/en");
    const here = page.locator(".station.is-current");
    await expect(here).toHaveCount(1);
    await expect(here).toHaveAttribute("aria-current", "step");
    await expect(here.getByText("You are here")).toBeVisible();
    await here.getByRole("link", { name: "Start", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${UNIT}$`));
  });

  test("topics without a lesson are on the line but never offered as links", async ({ page }) => {
    await page.goto("/en");
    const planned = page.locator(".station.is-planned");
    expect(await planned.count()).toBeGreaterThan(0);
    await expect(planned.locator("a")).toHaveCount(0);
    await expect(planned.first().getByText("In preparation")).toBeVisible();
  });

  test("the station opens with the sentence the lesson teaches", async ({ page }) => {
    await page.goto("/en");
    const hero = page.locator("figure.slotline");
    await expect(hero).toBeVisible();
    // Position 2 is the finite verb, and it is the only yellow thing in the app.
    await expect(hero.locator("li.verb .pos")).toHaveText("2");
    await expect(hero.locator("li.verb .word")).toHaveAttribute("lang", "de");
  });

  test("unreviewed content is labelled in the learner's language, not by its status code", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByText("Not reviewed").first()).toBeVisible();
    await expect(page.getByText("needs_review")).toHaveCount(0);
  });

  test("streak, XP and hearts are always in reach and start honestly at zero", async ({ page }) => {
    await page.goto("/en");
    const pills = page.getByRole("list", { name: "Your progress on this device" });
    await expect(pills).toBeVisible();
    await expect(pills.getByText("Days in a row: 0")).toHaveCount(1);
    await expect(pills.getByText("Hearts: 5 of 5")).toHaveCount(1);
  });

  test("the daily goal counts answers against the plan", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { name: "Daily goal" })).toBeVisible();
    await expect(page.getByText("0 of 10 answers today")).toBeVisible();
  });

  test("the language picker marks the current language", async ({ page }) => {
    await page.goto("/en");
    const picker = page.getByRole("navigation", { name: "Explanation language" });
    await expect(picker.locator('a[aria-current="page"]')).toHaveAttribute("href", "/en");
  });

  test("on a wide screen the navigation column carries the sections and the tab bar is hidden", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
    await expect(page.locator("nav.tabbar")).toBeHidden();
  });

  test("the gate offers to continue in the language this browser used last", async ({ page }) => {
    await page.goto("/uk");
    // The language is written after the page hydrates. Wait for that write before leaving,
    // otherwise the next navigation can interrupt it and the test races the browser.
    await expect
      .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("deutschgo.language.v1") ?? "null")))
      .toBe("uk");
    await page.goto("/");
    const link = page.getByRole("link", { name: /Продовжити/ });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/uk$/);
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
});

test.describe("lesson: a guided run", () => {
  test("opens with leave and progress, and an introduction with honest banners", async ({ page }) => {
    await page.goto(UNIT);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Leave the lesson" })).toBeVisible();
    await expect(page.getByRole("progressbar")).toBeVisible();
    // Learning a lesson for the first time never costs hearts, so none are shown (ADR-0014).
    await expect(page.getByRole("img", { name: /Hearts/ })).toHaveCount(0);
    // The unit is not yet human-reviewed, so the honest banner must be there.
    await expect(page.locator("p.banner").first()).toBeVisible();
    await expect(page.getByText(/progress is not saved yet/)).toBeVisible();
    // The site's navigation steps aside during a lesson.
    await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
  });

  test("German text is marked as German once the learner reaches it", async ({ page }) => {
    await page.goto(UNIT);
    await continueUntil(page, page.locator('[lang="de"]').first());
    expect(await page.locator('[lang="de"]').count()).toBeGreaterThan(0);
  });

  test("an exercise is checked only once it is answered", async ({ page }) => {
    await page.goto(UNIT);
    await continueUntil(page, firstExercise(page));
    await expect(action(page, "Check")).toBeDisabled();
    await firstExercise(page).getByRole("radio", { name: "Heute habe ich frei." }).check();
    await expect(action(page, "Check")).toBeEnabled();
  });

  test("a wrong answer is explained, the right option is shown, and the exercise comes back later", async ({ page }) => {
    await page.goto(UNIT);
    await continueUntil(page, firstExercise(page));
    await firstExercise(page).getByRole("radio", { name: "Heute ich habe frei." }).check();
    await action(page, "Check").click();

    const footer = page.locator("footer.flow-footer");
    await expect(footer).toHaveClass(/is-bad/);
    await expect(footer.getByText("Not quite", { exact: true })).toBeVisible();
    await expect(footer.getByText("This one comes back at the end of the lesson.")).toBeVisible();
    await expect(page.locator(".option.is-right")).toContainText("Heute habe ich frei.");
    // While learning, a wrong answer costs no heart and the lesson goes on.
    await expect(page.getByRole("img", { name: /Hearts/ })).toHaveCount(0);
    await action(page, "Continue").click();
    await expect(page.locator("section.exercise")).not.toContainText("Heute ich habe frei.");
  });

  test("a lesson already finished on this device is practice: a wrong answer costs a heart", async ({ page }) => {
    // Mark every exercise of the lesson as answered on this device, as after a first run.
    const bundle = JSON.parse(readFileSync(join(process.cwd(), "generated", "content.json"), "utf8"));
    const unit = bundle.units.find((u: { id: string }) => u.id === UNIT.split("/").pop());
    const ids = (unit.blocks.find((b: { type: string }) => b.type === "exercises").items as { id: string }[]).map((e) => e.id);
    await page.goto("/en");
    await page.evaluate(
      ({ unitId, ids }) => {
        const at = Date.now() - 60_000;
        const events = ids.map((exerciseId, i) => ({
          id: `seed-${i}`, kind: "attempt", at, contentId: exerciseId, conceptIds: [], skill: "knowledge",
          correct: true, unitId, exerciseId,
        }));
        localStorage.setItem("deutschgo.events.v1", JSON.stringify(events));
      },
      { unitId: unit.id as string, ids },
    );
    await page.goto(UNIT);
    await expect(page.getByRole("img", { name: "Hearts: 5 of 5" })).toBeVisible();
    await continueUntil(page, firstExercise(page));
    await expect(page.getByText("Practice: a wrong answer costs a heart.")).toBeVisible();
    await firstExercise(page).getByRole("radio", { name: "Heute ich habe frei." }).check();
    await action(page, "Check").click();
    await expect(page.getByRole("img", { name: "Hearts: 4 of 5" })).toBeVisible();
  });

  test("a right answer turns the bar green and moves on", async ({ page }) => {
    await page.goto(UNIT);
    await continueUntil(page, firstExercise(page));
    await firstExercise(page).getByRole("radio", { name: "Heute habe ich frei." }).check();
    await action(page, "Check").click();
    await expect(page.locator("footer.flow-footer")).toHaveClass(/is-ok/);
    await expect(page.getByText("Right!")).toBeVisible();
    await expect(action(page, "Continue")).toBeEnabled();
  });

  test("radio options and checking work with the keyboard alone", async ({ page }) => {
    await page.goto(UNIT);
    await continueUntil(page, firstExercise(page));
    const option = firstExercise(page).getByRole("radio", { name: "Heute habe ich frei." });
    await option.focus();
    await page.keyboard.press("Space");
    await expect(option).toBeChecked();
    await page.keyboard.press("Enter");
    await expect(page.locator("footer.flow-footer")).toHaveClass(/is-ok/);
  });

  test("answering every exercise ends on an arrival screen with XP, accuracy and time", async ({ page }) => {
    test.setTimeout(90_000);
    // The answers come from the compiled content bundle, the same data the page renders.
    const bundle = JSON.parse(readFileSync(join(process.cwd(), "generated", "content.json"), "utf8"));
    const unit = bundle.units.find((u: { id: string }) => u.id === UNIT.split("/").pop());
    const items = unit.blocks.find((b: { type: string }) => b.type === "exercises").items as Record<string, any>[];
    const byId = Object.fromEntries(items.map((e) => [e.id, e]));

    await page.goto(UNIT);
    for (let guard = 0; guard < 60 && !(await page.locator("section.arrive").count()); guard++) {
      const exercise = page.locator("section.exercise");
      if (!(await exercise.count())) {
        await action(page, /^(Continue|Finish)$/).click();
        continue;
      }
      const e = byId[(await exercise.getAttribute("aria-labelledby"))!.replace(/-prompt$/, "")]!;
      if (e.type === "single_choice") {
        await page.getByRole("radio", { name: e.options.find((o: any) => o.correct).de, exact: true }).check();
      } else if (e.type === "word_order") {
        let rest: string = e.accept[0].replace(/[.?!]$/, "");
        const used = new Set<number>();
        while (rest.length) {
          const i = (e.tokens as string[]).findIndex((t, k) => !used.has(k) && rest.toLowerCase().startsWith(t.toLowerCase()));
          used.add(i);
          await page.locator(".tokens button.token").nth(i).click();
          rest = rest.slice(e.tokens[i].length).trimStart();
        }
      } else if (e.type === "cloze") {
        for (let g = 0; g < e.gaps.length; g++) await page.locator("input.gap").nth(g).fill(e.gaps[g].accept[0]);
      } else {
        await page.locator("input.free").fill(e.accept[0]);
      }
      await action(page, "Check").click();
      await expect(page.locator("footer.flow-footer")).toHaveClass(/is-ok/);
      await action(page, /^(Continue|Finish)$/).click();
    }

    const arrive = page.locator("section.arrive");
    await expect(arrive.getByRole("heading", { name: "Lesson complete!" })).toBeVisible();
    await expect(arrive.getByText(`+${items.length * 10}`)).toBeVisible();
    await expect(arrive.getByText("100%")).toBeVisible();
    await expect(arrive.getByText("Days in a row: 1")).toBeVisible();
    await expect(arrive.getByText(/Your result is kept in this browser only/)).toBeVisible();

    // Back on the line, the station is ticked.
    await arrive.getByRole("link", { name: "Back to the line" }).click();
    await expect(page.locator(".station.is-done").first()).toContainText("Done");
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

test.describe("your own area", () => {
  test("says where the data actually lives without an account", async ({ page }) => {
    await page.goto("/en/me");
    await expect(page.getByRole("heading", { level: 1, name: "You" })).toBeVisible();
    await expect(page.getByText(/Without signing in, everything below is kept in this browser/)).toBeVisible();
    await expect(page.getByText(/Running in a browser tab|Running as an installed app/)).toBeVisible();
  });

  test("progress stays empty until an exercise is answered, then counts it", async ({ page }) => {
    await page.goto("/en/me");
    await expect(page.getByText(/Your progress appears here/)).toBeVisible();

    await page.goto(UNIT);
    await continueUntil(page, firstExercise(page));
    await firstExercise(page).getByRole("radio", { name: "Heute habe ich frei." }).check();
    await action(page, "Check").click();
    await expect(page.locator("footer.flow-footer")).toHaveClass(/is-ok/);

    await page.goto("/en/me");
    await expect(page.getByRole("progressbar")).toBeVisible();
    await expect(page.getByText("answers", { exact: true })).toBeVisible();
    await expect(page.getByText("Level 1")).toBeVisible();
  });

  test("saves a plan in this browser from the learner area and says it is device-only", async ({ page }) => {
    await page.goto("/en/me");
    await page.getByRole("radio", { name: "Work" }).check();
    await page.getByRole("radio", { name: "15 min" }).check();
    await page.getByRole("button", { name: "Save my plan" }).click();
    await expect(page.getByText("Your plan on this device: Work, 15 min a day.")).toBeVisible();
    await expect(page.getByText(/Saved only in this browser/)).toBeVisible();
    // The choice survives a reload because it is stored in this browser.
    await page.reload();
    await expect(page.getByRole("radio", { name: "Work" })).toBeChecked();
    // The daily goal follows the plan.
    await page.goto("/en");
    await expect(page.getByText("0 of 15 answers today")).toBeVisible();
  });

  test("sound effects can be switched off and stay off", async ({ page }) => {
    await page.goto("/en/me");
    const toggle = page.getByRole("switch", { name: "Sound effects" });
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await page.reload();
    await expect(page.getByRole("switch", { name: "Sound effects" })).toHaveAttribute("aria-checked", "false");
  });

  test("deleting the data on this device asks first, then reports it is gone", async ({ page }) => {
    await page.goto("/en/me");
    await page.getByRole("radio", { name: "Work" }).check();
    await page.getByRole("button", { name: "Save my plan" }).click();
    await expect(page.getByText("Your plan on this device: Work, 10 min a day.")).toBeVisible();

    await page.getByRole("button", { name: "Delete my data" }).click();
    await expect(page.getByText("Delete it all? This cannot be undone.")).toBeVisible();
    await page.getByRole("button", { name: "Delete my data" }).click();
    await expect(page.getByText(/^Deleted\./)).toBeVisible();
    await expect(page.getByText("No plan saved on this device yet.")).toBeVisible();
  });

  test("the XP figures start empty and say they are counted in this browser", async ({ page }) => {
    await page.goto("/en/me");
    await expect(page.getByText("Answer an exercise to earn XP and start a streak.")).toBeVisible();
    await expect(page.getByText(/Counted from answers in this browser only/)).toBeVisible();
  });

  test("reminders say plainly when push is not configured on this site", async ({ page }) => {
    await page.goto("/en/me");
    await expect(page.getByText("Reminders are not set up on this site yet.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Turn on daily reminder" })).toHaveCount(0);
  });

  test("practice says plainly when there is nothing due", async ({ page }) => {
    await page.goto("/en/practice");
    await expect(page.getByRole("heading", { level: 1, name: "Practice" })).toBeVisible();
    await expect(page.getByText("Nothing to practise yet.")).toBeVisible();
    await expect(page.getByText(/spacing schedule/)).toBeVisible();
  });
});
