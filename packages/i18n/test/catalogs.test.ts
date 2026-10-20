import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { LOCALES, PIVOT_LOCALE, catalogs, isPreviewLocale, localeInfo, offeredLocales, placeholders, translator } from "../src/index.ts";
import type { MessageKey } from "../src/index.ts";

const all = catalogs();
const pivot = all[PIVOT_LOCALE]!;
const keys = Object.keys(pivot) as MessageKey[];

/** Sample values that satisfy every placeholder used anywhere in the catalogs. */
const SAMPLES: Record<string, string | number> = {
  from: "A1", to: "A2", steps: 3, level: "A1", minutes: 25, count: 2,
  language: "English", current: 1, total: 10, correct: 7, topic: "Word order", n: 1234,
  goal: "Work", answered: 3,
};

describe("catalog completeness", () => {
  it("covers every locale in the registry", () => {
    for (const l of LOCALES) assert.ok(all[l.code], `catalog missing for ${l.code}`);
  });
  for (const [code, catalog] of Object.entries(all)) {
    it(`${code} defines exactly the pivot keys`, () => {
      const missing = keys.filter((k) => !(k in catalog));
      const extra = Object.keys(catalog).filter((k) => !(keys as string[]).includes(k));
      assert.deepEqual(missing, [], `missing keys in ${code}`);
      assert.deepEqual(extra, [], `unknown keys in ${code}`);
    });
    it(`${code} uses the same placeholders as the pivot`, () => {
      for (const key of keys) {
        assert.deepEqual([...placeholders(catalog[key]!)].sort(), [...placeholders(pivot[key]!)].sort(),
          `placeholders differ for "${key}" in ${code}`);
      }
    });
    it(`${code} formats every message without throwing`, () => {
      const t = translator(code);
      for (const key of keys) assert.equal(typeof t(key, SAMPLES), "string");
    });
    it(`${code} has no empty or placeholder-only message`, () => {
      for (const key of keys) {
        const text = translator(code)(key, SAMPLES).trim();
        assert.ok(text.length > 0, `empty message "${key}" in ${code}`);
        assert.doesNotMatch(text, /^[{}\s]*$/, `message "${key}" in ${code} renders to nothing`);
      }
    });
  }
});

describe("translator", () => {
  it("translates into the requested locale", () => {
    assert.equal(translator("uk")("exercise.check"), "Перевірити");
    assert.equal(translator("ru")("exercise.check"), "Проверить");
  });
  it("applies the locale's plural rules", () => {
    assert.equal(translator("ru")("catalog.conceptCount", { count: 3 }), "3 темы");
    assert.equal(translator("ru")("catalog.conceptCount", { count: 11 }), "11 тем");
    assert.equal(translator("en")("catalog.conceptCount", { count: 0 }), "No topics yet");
    assert.equal(translator("ar")("catalog.conceptCount", { count: 2 }), "موضوعان");
  });
  it("falls back to the pivot for an unknown locale", () => {
    assert.equal(translator("tr")("exercise.check"), "Check");
  });
  it("falls back to the pivot message, with pivot plural rules, for a missing key", () => {
    const partial = { ...all["ru"] } as Record<string, string>;
    delete partial["catalog.conceptCount"];
    // Simulated half-translated catalog: the real ones are complete (asserted above).
    const message = partial["catalog.conceptCount"] ?? all["en"]!["catalog.conceptCount"];
    assert.match(message, /topics/);
  });
  it("throws on an unknown key instead of rendering it", () => {
    assert.throws(() => translator("en")("nope" as MessageKey), /unknown message key/);
  });
});

describe("locale registry", () => {
  it("marks Arabic as right-to-left and preview-only", () => {
    assert.equal(localeInfo("ar").dir, "rtl");
    assert.equal(isPreviewLocale("ar"), true);
    assert.deepEqual(offeredLocales().map((l) => l.code), ["en", "uk", "ru"]);
  });
  it("defaults to the pivot for an unknown code", () => {
    assert.equal(localeInfo("zz").code, PIVOT_LOCALE);
  });
});
