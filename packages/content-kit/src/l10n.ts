/** Localization-key collection and resolution. */
import type { Localization } from "./types.ts";

export const KEY_RE = /^@([a-z0-9][a-z0-9_.-]*)$/;

/** Collects all "@key" references anywhere in a canonical entity (deterministic order). */
export function collectKeys(value: unknown, out: Set<string> = new Set()): Set<string> {
  if (typeof value === "string") {
    const m = KEY_RE.exec(value);
    if (m?.[1]) out.add(m[1]);
  } else if (Array.isArray(value)) {
    for (const v of value) collectKeys(v, out);
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectKeys(v, out);
  }
  return out;
}

export function isRef(value: unknown): value is `@${string}` {
  return typeof value === "string" && KEY_RE.test(value);
}

export interface ResolveOptions {
  lang: string;
  pivot: string;
}

export type Resolved = { text: string; lang: string; fallback: boolean } | { text: undefined; lang: undefined; fallback: false };

/**
 * Resolves a key for a learner language, falling back to the pivot language.
 * The `fallback` flag MUST be surfaced in UI so a learner is never misled
 * about which language they are reading.
 */
export function resolveKey(
  l10n: Map<string, Localization>,
  entityId: string,
  ref: string,
  opts: ResolveOptions,
): Resolved {
  const key = ref.startsWith("@") ? ref.slice(1) : ref;
  const own = l10n.get(`${opts.lang}:${entityId}`)?.strings[key];
  if (own !== undefined) return { text: own, lang: opts.lang, fallback: false };
  const pivot = l10n.get(`${opts.pivot}:${entityId}`)?.strings[key];
  if (pivot !== undefined) return { text: pivot, lang: opts.pivot, fallback: true };
  return { text: undefined, lang: undefined, fallback: false };
}
