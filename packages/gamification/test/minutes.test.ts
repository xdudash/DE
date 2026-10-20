import { test } from "node:test";
import assert from "node:assert/strict";
import { minutesUntil } from "../src/progress.ts";

const MIN = 60_000;

test("minutesUntil rounds up and never reports zero while a heart is still coming", () => {
  assert.equal(minutesUntil(1000 + 30 * MIN, 1000), 30);
  assert.equal(minutesUntil(1000 + 30 * MIN + 1, 1000), 31);
  assert.equal(minutesUntil(1000 + 5_000, 1000), 1);
  assert.equal(minutesUntil(1000, 1000), 1);
  assert.equal(minutesUntil(500, 1000), 1);
});
