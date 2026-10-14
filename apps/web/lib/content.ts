/**
 * Server-side access to the compiled content bundle (built from content/ by
 * `npm run content:build`; see ADR-0003). Never imported by client components.
 */
import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { collectKeys } from "@deutschgo/content-kit";
import type { ContentBundle } from "@deutschgo/content-kit";

let cached: ContentBundle | undefined;

export function bundle(): ContentBundle {
  if (!cached) {
    const path = join(process.cwd(), "generated", "content.json");
    cached = JSON.parse(readFileSync(path, "utf8")) as ContentBundle;
  }
  return cached;
}

export interface Text {
  text: string;
  /** Language actually shown; differs from the requested one on fallback. */
  lang: string;
  fallback: boolean;
  /** Translation status of the shown text (e.g. machine_draft). */
  status: string;
}

export type Dictionary = Record<string, Text>;

/** Resolves every "@key" an entity uses, with honest pivot fallback. */
export function dictionaryFor(entityId: string, entity: unknown, lang: string): Dictionary {
  const b = bundle();
  const own = b.l10n[lang]?.[entityId];
  const pivot = b.l10n[b.pivot]?.[entityId];
  const out: Dictionary = {};
  for (const key of collectKeys(entity)) {
    const mine = own?.strings[key];
    if (mine !== undefined) out[key] = { text: mine, lang, fallback: false, status: own!.status };
    else if (pivot?.strings[key] !== undefined) out[key] = { text: pivot.strings[key]!, lang: b.pivot, fallback: true, status: pivot.status };
    else out[key] = { text: `⟦missing: ${key}⟧`, lang, fallback: true, status: "missing" };
  }
  return out;
}

export function t(dict: Dictionary, ref: string): string {
  return dict[ref.replace(/^@/, "")]?.text ?? ref;
}

export function explanationLanguages() {
  return bundle().languages.filter((l) => l.explanations);
}
