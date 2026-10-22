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
/**
 * Through an outage of the JWKS endpoint the last good keys are used for at most this
 * long, so a key Supabase has revoked stops verifying even if the endpoint stays down.
 */
export const MAX_STALE_MS = 6 * 60 * 60_000;
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
  return new URL("/auth/v1/.well-known/jwks.json", new URL(projectUrl).origin).toString();
}

/** The `iss` Supabase Auth writes into this project's tokens. */
export function issuerFor(projectUrl: string): string {
  return new URL("/auth/v1", new URL(projectUrl).origin).toString();
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
  let lastError: { at: number; error: KeysUnavailable } | null = null;
  let inflight: Promise<VerificationKeys> | null = null;

  async function load(): Promise<VerificationKeys> {
    lastFetch = clock();
    let res: Response;
    try {
      res = await fetchImpl(jwksUrl(cfg.url), { cache: "no-store", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
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
    // A load failed moments ago: answer with that failure instead of asking again, so
    // requests during an outage do not each wait for the endpoint.
    if (lastError && clock() - lastError.at < REFRESH_MIN_INTERVAL_MS) return Promise.reject(lastError.error);
    inflight ??= load()
      .then((keys) => {
        lastError = null;
        return keys;
      })
      .catch((err: unknown) => {
        const error = err instanceof KeysUnavailable ? err : new KeysUnavailable("unexpected");
        lastError = { at: clock(), error };
        throw error;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  }

  const usableStale = () => (cached && clock() - cached.at < MAX_STALE_MS ? cached.keys : null);

  return {
    async get() {
      if (cached && clock() - cached.at < KEYS_TTL_MS) return cached.keys;
      try {
        return await loadOnce();
      } catch (err) {
        // Keys rotate rarely: during an outage of the JWKS endpoint, the last good set
        // still verifies today's tokens, up to MAX_STALE_MS. Without one, nothing can be verified.
        const stale = usableStale();
        if (stale) return stale;
        throw err;
      }
    },
    async refresh() {
      if (cached && clock() - lastFetch < REFRESH_MIN_INTERVAL_MS) return usableStale() ?? loadOnce();
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
