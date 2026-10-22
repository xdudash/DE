/**
 * The keys that verify access tokens: the project's public JWKS, fetched from Supabase
 * Auth and cached, plus the optional legacy HS256 secret (DG-026).
 *
 * The JWKS is public. It is cached for KEYS_TTL_MS; a token naming an unknown key id
 * triggers one refresh, at most once per REFRESH_MIN_INTERVAL_MS, so a stream of forged
 * key ids cannot turn this server into a request amplifier.
 */
import type { AuthConfig } from "./config.ts";
import type { Jwk, VerificationKeys } from "./jwt.ts";

export const KEYS_TTL_MS = 10 * 60_000;
export const REFRESH_MIN_INTERVAL_MS = 60_000;
const FETCH_TIMEOUT_MS = 5_000;

/** The keys could not be loaded, so no token can be checked right now. */
export class KeysUnavailable extends Error {
  constructor(reason: string) {
    super(`signing keys unavailable: ${reason}`);
    this.name = "KeysUnavailable";
  }
}

export interface KeySource {
  /** Cached keys, loading them when absent or older than the TTL. */
  get(): Promise<VerificationKeys>;
  /** Fresh keys after an unknown key id; returns the cached ones when refreshed too recently. */
  refresh(): Promise<VerificationKeys>;
}

export function jwksUrl(projectUrl: string): string {
  return `${projectUrl}/auth/v1/.well-known/jwks.json`;
}

function parseJwks(body: unknown): Jwk[] {
  const keys = (body as { keys?: unknown } | null)?.keys;
  if (!Array.isArray(keys)) throw new KeysUnavailable("response has no keys array");
  return keys.filter((k): k is Jwk => typeof k === "object" && k !== null && typeof (k as Jwk).kty === "string");
}

export function keySource(
  cfg: Pick<AuthConfig, "url" | "jwtSecret">,
  fetchImpl: typeof fetch = fetch,
  clock: () => number = Date.now,
): KeySource {
  let cached: { keys: VerificationKeys; at: number } | null = null;
  let lastFetch = -Infinity;
  let inflight: Promise<VerificationKeys> | null = null;

  async function load(): Promise<VerificationKeys> {
    lastFetch = clock();
    let res: Response;
    try {
      res = await fetchImpl(jwksUrl(cfg.url), { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    } catch {
      throw new KeysUnavailable("network");
    }
    if (!res.ok) throw new KeysUnavailable(`HTTP ${res.status}`);
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      throw new KeysUnavailable("response is not JSON");
    }
    const keys: VerificationKeys = { jwks: parseJwks(body) };
    if (cfg.jwtSecret) keys.hs256Secret = cfg.jwtSecret;
    cached = { keys, at: clock() };
    return keys;
  }

  function loadOnce(): Promise<VerificationKeys> {
    inflight ??= load().finally(() => {
      inflight = null;
    });
    return inflight;
  }

  return {
    async get() {
      if (cached && clock() - cached.at < KEYS_TTL_MS) return cached.keys;
      // A load failed moments ago: keep serving the last good keys instead of retrying per request.
      if (cached && clock() - lastFetch < REFRESH_MIN_INTERVAL_MS) return cached.keys;
      const stale = cached;
      try {
        return await loadOnce();
      } catch (err) {
        // Keys rotate rarely: during an outage of the JWKS endpoint, the last good set
        // still verifies today's tokens. Without one, nothing can be verified.
        if (stale) return stale.keys;
        throw err;
      }
    },
    async refresh() {
      if (cached && clock() - lastFetch < REFRESH_MIN_INTERVAL_MS) return cached.keys;
      return loadOnce();
    },
  };
}

const sources = new Map<string, KeySource>();

/** One shared, cached source per project and secret for the running server. */
export function keySourceFor(cfg: Pick<AuthConfig, "url" | "jwtSecret">): KeySource {
  const id = `${cfg.url}\n${cfg.jwtSecret ?? ""}`;
  let source = sources.get(id);
  if (!source) {
    source = keySource(cfg);
    sources.set(id, source);
  }
  return source;
}
