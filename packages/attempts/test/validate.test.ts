import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { AttemptError } from "../src/errors.ts";
import { parseAttemptRequest } from "../src/validate.ts";
import { request } from "./fixtures.ts";

const rejects = (body: unknown, code: string, match?: RegExp) =>
  assert.throws(() => parseAttemptRequest(body), (e: unknown) => {
    assert.ok(e instanceof AttemptError);
    assert.equal(e.code, code);
    if (match) assert.match(e.message, match);
    return true;
  });

describe("parseAttemptRequest", () => {
  it("accepts a well-formed request of each response type", () => {
    for (const response of [
      { type: "single_choice", optionId: "b" },
      { type: "word_order", order: [0, 1, 2, 3] },
      { type: "cloze", gaps: ["lerne", "ich"] },
      { type: "transform", text: "Heute Abend gehe ich ins Kino." },
      { type: "multi_choice", optionIds: ["a", "c"] },
      { type: "true_false", value: false },
      { type: "match_pairs", matches: { a: "a", b: "c" } },
      { type: "reply_choice", optionId: "a" },
      { type: "article_input", text: "der" },
      { type: "form_input", text: "bin" },
      { type: "gap_fill_input", text: "Tag" },
      { type: "spelling_input", text: "Mai" },
      { type: "number_input", text: "zwölf" },
      { type: "time_input", text: "halb drei" },
    ]) {
      const parsed = parseAttemptRequest(request({ response: response as never }));
      assert.deepEqual(parsed.response, response);
    }
  });

  it("refuses a body that is not an object", () => {
    for (const body of [null, "x", 7, [], undefined]) rejects(body, "malformed_request");
  });

  it("refuses a client-asserted verdict instead of silently discarding it", () => {
    rejects({ ...request(), correct: true }, "malformed_request", /server evaluates/);
    rejects({ ...request(), score: 1 }, "malformed_request", /server evaluates/);
  });

  it("validates identifiers and the timestamp", () => {
    rejects(request({ eventId: "not-a-uuid" }), "malformed_request", /UUID/);
    rejects(request({ unitId: "concept.syntax.v2_declarative" }), "malformed_request", /unit id/);
    rejects(request({ exerciseId: "X_Order" }), "malformed_request", /local id/);
    rejects(request({ contentVersion: "1.0" }), "malformed_request", /MAJOR/);
    rejects(request({ occurredAt: "yesterday" }), "malformed_request", /ISO 8601/);
  });

  it("validates each response shape", () => {
    rejects(request({ response: { type: "word_order", order: ["a"] } as never }), "malformed_request", /token indices/);
    rejects(request({ response: { type: "word_order", order: [-1] } as never }), "malformed_request", /token indices/);
    rejects(request({ response: { type: "cloze", gaps: [1] } as never }), "malformed_request", /strings/);
    rejects(request({ response: { type: "single_choice" } as never }), "malformed_request", /optionId/);
    rejects(request({ response: { type: "speaking" } as never }), "malformed_request", /unsupported response type/);
    rejects(request({ response: "b" as never }), "malformed_request", /object/);
  });
});
