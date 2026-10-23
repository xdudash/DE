/**
 * Sign-in configuration from server environment variables. Pure: takes the environment
 * as an argument so the rules are testable. Returns null when sign-in is not set up,
 * and every caller then says so instead of pretending to sign anyone in.
 *
 * Server-side only: the service-role key must never reach the browser bundle, so none of
 * these names carries the NEXT_PUBLIC_ prefix.
 */
export interface AuthConfig {
  /** Project URL without a trailing slash, e.g. https://<ref>.supabase.co */
  url: string;
  /** Publishable (anon) key: public by design, sent with auth requests. */
  publishableKey: string;
  /**
   * Legacy HS256 secret (older projects, the local stack). Optional: projects with
   * asymmetric signing keys are verified against their public JWKS instead (DG-026).
   */
  jwtSecret?: string;
  /** Needed only to delete an account; absent means deletion is reported as unavailable. */
  serviceRoleKey?: string;
}

export function authConfig(env: Record<string, string | undefined> = process.env): AuthConfig | null {
  const rawUrl = env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const publishableKey = env.SUPABASE_PUBLISHABLE_KEY?.trim();
  const jwtSecret = env.SUPABASE_JWT_SECRET?.trim() || undefined;
  if (!rawUrl || !publishableKey) return null;
  // Refuse a plain-HTTP project URL: tokens and codes must not travel unencrypted, and the
  // one legitimate exception (a local stack) is the loopback address.
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  const local = parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && local)) return null;
  return {
    url: rawUrl,
    publishableKey,
    ...(jwtSecret ? { jwtSecret } : {}),
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined,
  };
}

/**
 * The test sign-in button. Off unless AUTH_TEST_LOGIN=1 AND this is not the production
 * deployment (Vercel sets VERCEL_ENV). It creates throwaway anonymous accounts, so it must
 * never be reachable on the public site.
 */
export function testLoginEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.AUTH_TEST_LOGIN === "1" && env.VERCEL_ENV !== "production";
}
