/**
 * Talks to the hosted Supabase Auth API over HTTPS with plain fetch. No SDK: the flow is
 * three requests (authorize redirect, PKCE code exchange, admin delete), and keeping them
 * here keeps the authentication surface small and reviewable (ADR-0013).
 */
import type { AuthConfig } from "./config.ts";

export const PROVIDERS = ["google", "apple"] as const;
export type Provider = (typeof PROVIDERS)[number];

export function isProvider(value: string | null): value is Provider {
  return value !== null && (PROVIDERS as readonly string[]).includes(value);
}

/** Where the provider sends the browser to start sign-in. */
export function authorizeUrl(cfg: AuthConfig, provider: Provider, redirectTo: string, challenge: string): string {
  const url = new URL(`${cfg.url}/auth/v1/authorize`);
  url.searchParams.set("provider", provider);
  url.searchParams.set("redirect_to", redirectTo);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "s256");
  return url.toString();
}

export class AuthExchangeFailed extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`auth request failed with HTTP ${status}`);
    this.name = "AuthExchangeFailed";
    this.status = status;
  }
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  email?: string;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** Exchanges the one-time code from the redirect, proving possession of the verifier. */
export async function exchangeCode(
  cfg: AuthConfig,
  code: string,
  verifier: string,
  fetchImpl: FetchLike = fetch,
): Promise<Tokens> {
  const res = await fetchImpl(`${cfg.url}/auth/v1/token?grant_type=pkce`, {
    method: "POST",
    headers: { apikey: cfg.publishableKey, "content-type": "application/json" },
    body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
    cache: "no-store",
  });
  if (!res.ok) throw new AuthExchangeFailed(res.status);
  return parseTokens(await res.json(), res.status);
}

/** Reads the token fields of an Auth response; anything else is a failed exchange. */
function parseTokens(raw: unknown, status: number): Tokens {
  const body = (raw ?? {}) as {
    access_token?: unknown;
    refresh_token?: unknown;
    expires_in?: unknown;
    user?: { email?: unknown };
  };
  if (typeof body.access_token !== "string" || typeof body.refresh_token !== "string") {
    throw new AuthExchangeFailed(status);
  }
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresIn: typeof body.expires_in === "number" ? body.expires_in : 3600,
    email: typeof body.user?.email === "string" ? body.user.email : undefined,
  };
}

/**
 * Test sign-in: creates an anonymous learner in Supabase Auth and returns its real tokens.
 * Only reachable when testLoginEnabled() allows it (preview deployments, never production),
 * and it needs "Allow anonymous sign-ins" enabled in the Supabase project.
 */
export async function signUpAnonymously(cfg: AuthConfig, fetchImpl: FetchLike = fetch): Promise<Tokens> {
  const res = await fetchImpl(`${cfg.url}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: cfg.publishableKey, "content-type": "application/json" },
    body: "{}",
    cache: "no-store",
  });
  if (!res.ok) throw new AuthExchangeFailed(res.status);
  return parseTokens(await res.json(), res.status);
}

export class AccountDeletionUnavailable extends Error {
  constructor() {
    super("SUPABASE_SERVICE_ROLE_KEY is not set: accounts cannot be deleted here");
    this.name = "AccountDeletionUnavailable";
  }
}

/**
 * Deletes the auth user. Every learner table references auth.users with ON DELETE CASCADE
 * (migration 0001), so the learner's data goes with the account.
 */
export async function deleteAuthUser(cfg: AuthConfig, userId: string, fetchImpl: FetchLike = fetch): Promise<void> {
  if (!cfg.serviceRoleKey) throw new AccountDeletionUnavailable();
  const res = await fetchImpl(`${cfg.url}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: { apikey: cfg.serviceRoleKey, authorization: `Bearer ${cfg.serviceRoleKey}` },
    cache: "no-store",
  });
  if (!res.ok) throw new AuthExchangeFailed(res.status);
}
