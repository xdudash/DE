/** Request validation: the boundary where untrusted input stops. */
import { AttemptError } from "./errors.ts";
import type { AttemptRequest } from "./types.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-9a-f][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UNIT_ID = /^unit\.[a-z0-9]+(\.[a-z0-9_]+)+$/;
const LOCAL_ID = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/;
const SEMVER = /^\d+\.\d+\.\d+$/;

function str(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  if (typeof v !== "string" || v === "") throw new AttemptError("malformed_request", `"${key}" must be a non-empty string`);
  return v;
}

function responseOf(raw: unknown): AttemptRequest["response"] {
  if (typeof raw !== "object" || raw === null) throw new AttemptError("malformed_request", '"response" must be an object');
  const r = raw as Record<string, unknown>;
  switch (r.type) {
    case "single_choice":
      if (typeof r.optionId !== "string") throw new AttemptError("malformed_request", '"optionId" must be a string');
      return { type: "single_choice", optionId: r.optionId };
    case "connector_choice":
      if (typeof r.optionId !== "string") throw new AttemptError("malformed_request", '"optionId" must be a string');
      return { type: "connector_choice", optionId: r.optionId };
    case "verb_position":
      if (!Number.isInteger(r.tokenIndex) || (r.tokenIndex as number) < 0) {
        throw new AttemptError("malformed_request", '"tokenIndex" must be a non-negative integer');
      }
      return { type: "verb_position", tokenIndex: r.tokenIndex as number };
    case "word_order":
    case "token_bank_build":
      if (!Array.isArray(r.order) || r.order.some((i) => !Number.isInteger(i) || (i as number) < 0)) {
        throw new AttemptError("malformed_request", '"order" must be an array of token indices');
      }
      return { type: r.type, order: r.order as number[] };
    case "cloze":
      if (!Array.isArray(r.gaps) || r.gaps.some((g) => typeof g !== "string")) {
        throw new AttemptError("malformed_request", '"gaps" must be an array of strings');
      }
      return { type: "cloze", gaps: r.gaps as string[] };
    case "multi_choice":
      if (!Array.isArray(r.optionIds) || r.optionIds.some((x) => typeof x !== "string")) {
        throw new AttemptError("malformed_request", '"optionIds" must be an array of strings');
      }
      return { type: "multi_choice", optionIds: r.optionIds as string[] };
    case "true_false":
      if (typeof r.value !== "boolean") throw new AttemptError("malformed_request", '"value" must be a boolean');
      return { type: "true_false", value: r.value };
    case "match_pairs": {
      if (typeof r.matches !== "object" || r.matches === null || Array.isArray(r.matches)
        || Object.values(r.matches as Record<string, unknown>).some((x) => typeof x !== "string")) {
        throw new AttemptError("malformed_request", '"matches" must be an object of string to string');
      }
      return { type: "match_pairs", matches: r.matches as Record<string, string> };
    }
    case "reply_choice":
      if (typeof r.optionId !== "string") throw new AttemptError("malformed_request", '"optionId" must be a string');
      return { type: "reply_choice", optionId: r.optionId };
    case "article_input":
    case "form_input":
    case "gap_fill_input":
    case "spelling_input":
    case "number_input":
    case "time_input":
      if (typeof r.text !== "string") throw new AttemptError("malformed_request", '"text" must be a string');
      return { type: r.type, text: r.text };
    case "transform":
    case "keyword_build":
    case "negation":
      if (typeof r.text !== "string") throw new AttemptError("malformed_request", '"text" must be a string');
      return { type: r.type, text: r.text };
    default:
      throw new AttemptError("malformed_request", `unsupported response type "${String(r.type)}"`);
  }
}

/** Accepts unknown JSON and returns a typed request, or throws AttemptError. */
export function parseAttemptRequest(raw: unknown): AttemptRequest {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new AttemptError("malformed_request", "body must be a JSON object");
  }
  const o = raw as Record<string, unknown>;
  const eventId = str(o, "eventId");
  if (!UUID.test(eventId)) throw new AttemptError("malformed_request", '"eventId" must be a UUID');
  const unitId = str(o, "unitId");
  if (!UNIT_ID.test(unitId)) throw new AttemptError("malformed_request", '"unitId" is not a unit id');
  const exerciseId = str(o, "exerciseId");
  if (!LOCAL_ID.test(exerciseId)) throw new AttemptError("malformed_request", '"exerciseId" is not a local id');
  const contentVersion = str(o, "contentVersion");
  if (!SEMVER.test(contentVersion)) throw new AttemptError("malformed_request", '"contentVersion" must be MAJOR.MINOR.PATCH');
  const occurredAt = str(o, "occurredAt");
  if (Number.isNaN(Date.parse(occurredAt))) throw new AttemptError("malformed_request", '"occurredAt" must be an ISO 8601 timestamp');
  // A client claiming its own verdict is a bug or an attack; say so instead of ignoring it quietly.
  if ("correct" in o || "score" in o) {
    throw new AttemptError("malformed_request", 'the server evaluates answers: do not send "correct" or "score"');
  }
  return { eventId, unitId, exerciseId, contentVersion, response: responseOf(o.response), occurredAt };
}
