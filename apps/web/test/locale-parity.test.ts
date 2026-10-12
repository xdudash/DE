/**
 * The interface locale registry (packages/i18n) and the content language registry
 * (content/languages.yaml) are maintained separately on purpose: a language can be
 * technically supported before reviewed explanations exist (LOCALIZATION_POLICY.md).
 * They must still agree about what is offered to learners, so this test fails the
 * build when the two drift apart.
 */
import { strict as assert } from "node:assert";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { LOCALES, PIVOT_LOCALE, catalogs, offeredLocales } from "@deutschgo/i18n";
import type { LanguageInfo } from "@deutschgo/content-kit";

const CONTENT = join(dirname(fileURLToPath(import.meta.url)), "../../../content");

/**
 * Reading the registry needs the content loader's dependencies (yaml, ajv). Where they
 * are not installed, the suite skips with a reason instead of failing — CI installs
 * them, so the check is never silently lost.
 */
let languages: LanguageInfo[] = [];
let skip: string | false = false;
try {
  const { loadContent } = await import("@deutschgo/content-kit/load");
  languages = loadContent(CONTENT).repo.languages.languages;
} catch (err) {
  skip = `content loader unavailable (${(err as Error).message.split("\n")[0]}) — run npm install`;
}
const byCode = new Map(languages.map((l) => [l.code, l]));

describe("interface locales vs content languages", { skip }, () => {
  it("offers only locales that content declares as explanation languages", () => {
    for (const locale of offeredLocales()) {
      const lang = byCode.get(locale.code);
      assert.ok(lang, `UI offers "${locale.code}" but content/languages.yaml does not list it`);
      assert.equal(lang.explanations, true, `UI offers "${locale.code}" but content does not enable explanations for it`);
      assert.equal(lang.ui, true, `UI offers "${locale.code}" but content marks ui: false`);
    }
  });

  it("has an interface catalog for every language whose explanations are enabled", () => {
    const available = catalogs();
    for (const lang of languages.filter((l) => l.explanations)) {
      assert.ok(available[lang.code], `content enables explanations for "${lang.code}" but there is no interface catalog`);
    }
  });

  it("agrees on text direction, and knows the direction of preview locales too", () => {
    for (const locale of LOCALES) {
      const lang = byCode.get(locale.code);
      if (!lang) {
        assert.equal(locale.preview, true, `non-preview locale "${locale.code}" must exist in content/languages.yaml`);
        continue;
      }
      assert.equal(locale.dir, lang.dir, `direction mismatch for "${locale.code}"`);
    }
  });

  it("uses the same pivot language as the content contract", () => {
    const pivot = languages.find((l) => l.pivot);
    assert.equal(pivot?.code, PIVOT_LOCALE);
  });
});
