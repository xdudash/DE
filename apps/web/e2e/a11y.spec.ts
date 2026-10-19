import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// WCAG 2.2 A and AA. Only serious and critical violations fail the gate (ADR-0011);
// others are printed so they can be triaged without blocking every change.
const PAGES = ["/en", "/en/learn/unit.syntax.v2_declarative.a1", "/ar", "/uk/learn/unit.syntax.v2_declarative.a1"];

for (const path of PAGES) {
  test(`no serious accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    const minor = results.violations.filter((v) => v.impact !== "serious" && v.impact !== "critical");
    for (const v of minor) console.log(`[a11y ${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`);
    const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(blocking.map((v) => `${v.impact} ${v.id}: ${v.help}`)).toEqual([]);
  });
}
