/** Failure modes a caller must distinguish, with the HTTP status each maps to. */
export type AttemptErrorCode =
  | "malformed_request"   // 400: wrong shape, bad uuid, unparsable timestamp
  | "unknown_content"     // 404: no such unit or exercise in this build
  | "version_mismatch"    // 409: the client rendered a different version of the unit
  | "response_mismatch";  // 422: the response does not fit the exercise type

export class AttemptError extends Error {
  readonly code: AttemptErrorCode;
  readonly status: number;
  readonly detail?: string;
  constructor(code: AttemptErrorCode, message: string, detail?: string) {
    super(message);
    this.name = "AttemptError";
    this.code = code;
    this.status = STATUS[code];
    if (detail !== undefined) this.detail = detail;
  }
}

const STATUS: Record<AttemptErrorCode, number> = {
  malformed_request: 400,
  unknown_content: 404,
  version_mismatch: 409,
  response_mismatch: 422,
};
