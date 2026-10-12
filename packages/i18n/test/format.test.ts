import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { MessageError, formatMessage, placeholders } from "../src/format.ts";

describe("formatMessage", () => {
  it("interpolates named values", () => {
    assert.equal(formatMessage("Hallo, {name}!", { name: "Olena" }), "Hallo, Olena!");
    assert.equal(formatMessage("no placeholders"), "no placeholders");
  });
  it("formats numbers for the locale", () => {
    assert.equal(formatMessage("{n, number}", { n: 1234.5 }, "en"), "1,234.5");
    assert.equal(formatMessage("{n, number}", { n: 1234.5 }, "de").replace(/ /g, " "), "1.234,5");
  });
  it("selects English plural categories and substitutes #", () => {
    const m = "{count, plural, one {# topic} other {# topics}}";
    assert.equal(formatMessage(m, { count: 1 }, "en"), "1 topic");
    assert.equal(formatMessage(m, { count: 5 }, "en"), "5 topics");
  });
  it("uses Slavic one/few/many via Intl.PluralRules", () => {
    const ru = "{count, plural, one {# тема} few {# темы} many {# тем} other {# темы}}";
    assert.equal(formatMessage(ru, { count: 1 }, "ru"), "1 тема");
    assert.equal(formatMessage(ru, { count: 3 }, "ru"), "3 темы");
    assert.equal(formatMessage(ru, { count: 11 }, "ru"), "11 тем");
    assert.equal(formatMessage(ru, { count: 21 }, "ru"), "21 тема");
    const uk = "{count, plural, one {# тема} few {# теми} many {# тем} other {# теми}}";
    assert.equal(formatMessage(uk, { count: 2 }, "uk"), "2 теми");
    assert.equal(formatMessage(uk, { count: 5 }, "uk"), "5 тем");
  });
  it("prefers an exact =0 arm over the plural category", () => {
    const m = "{count, plural, =0 {nothing due} one {# item due} other {# items due}}";
    assert.equal(formatMessage(m, { count: 0 }, "en"), "nothing due");
    assert.equal(formatMessage(m, { count: 1 }, "en"), "1 item due");
  });
  it("handles select with a fallback arm", () => {
    const m = "{state, select, review_due {Review due} needs_practice {Needs practice} other {In progress}}";
    assert.equal(formatMessage(m, { state: "review_due" }), "Review due");
    assert.equal(formatMessage(m, { state: "whatever" }), "In progress");
  });
  it("supports nesting inside arms", () => {
    const m = "{count, plural, one {{name} has one task} other {{name} has {count, number} tasks}}";
    assert.equal(formatMessage(m, { count: 1, name: "Dmitri" }, "en"), "Dmitri has one task");
    assert.equal(formatMessage(m, { count: 1200, name: "Dmitri" }, "en"), "Dmitri has 1,200 tasks");
  });
  it("renders an explicit empty string for null or undefined", () => {
    assert.equal(formatMessage("[{x}]", { x: null }), "[]");
    assert.equal(formatMessage("[{x}]", { x: undefined }), "[]");
  });
  it("fails loudly instead of printing a broken string", () => {
    assert.throws(() => formatMessage("Hallo, {name}!", {}), MessageError);
    assert.throws(() => formatMessage("{count, plural, one {#}", { count: 1 }), MessageError);
    assert.throws(() => formatMessage("{n, plural, two {#}}", { n: 5 }, "en"), MessageError);
    assert.throws(() => formatMessage("{n, date, short}", { n: 1 }), MessageError);
    assert.throws(() => formatMessage("{n, number}", { n: "abc" }), MessageError);
  });
});

describe("placeholders", () => {
  it("collects names from the message and from inside arms", () => {
    assert.deepEqual([...placeholders("Hi {name}, {count, plural, one {# task} other {# tasks for {name}}}")],
      ["name", "count"]);
  });
  it("returns an empty set for a plain message", () => {
    assert.equal(placeholders("plain").size, 0);
  });
});
