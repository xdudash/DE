/**
 * PKCE (RFC 7636) for the sign-in redirect. The verifier never leaves the server and
 * its cookie; only the S256 challenge goes to the auth provider, so an intercepted
 * authorization code cannot be exchanged by anyone else.
 */
import { createHash, randomBytes } from "node:crypto";

/** 32 random bytes → 43 URL-safe characters, the RFC's minimum length is 43. */
export function newVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export function challengeFor(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}
