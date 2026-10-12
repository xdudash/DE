/** Compiles a validated ContentRepo into the JSON bundle consumed by apps (build-time delivery, ADR-0003). */
import type { CoverageRow } from "./checks.ts";
import type { Concept, ContentRepo, LanguageInfo, Route, Unit } from "./types.ts";

export const BUNDLE_FORMAT = 1;

export interface BundleLocalization {
  status: string;
  stale: boolean;
  strings: Record<string, string>;
}

export interface ContentBundle {
  format: typeof BUNDLE_FORMAT;
  languages: LanguageInfo[];
  pivot: string;
  concepts: Concept[];
  units: Unit[];
  routes: Route[];
  /** lang -> entity id -> localization */
  l10n: Record<string, Record<string, BundleLocalization>>;
  coverage: CoverageRow[];
}

const byId = <T extends { id: string }>(a: T, b: T) => a.id.localeCompare(b.id);

export function compileBundle(repo: ContentRepo, coverage: CoverageRow[]): ContentBundle {
  const versions = new Map<string, string>();
  for (const e of [...repo.concepts.values(), ...repo.units.values(), ...repo.routes.values()]) versions.set(e.id, e.version);
  const l10n: ContentBundle["l10n"] = {};
  for (const loc of [...repo.l10n.values()].sort((a, b) => `${a.lang}:${a.entity}`.localeCompare(`${b.lang}:${b.entity}`))) {
    (l10n[loc.lang] ??= {})[loc.entity] = {
      status: loc.status,
      stale: versions.get(loc.entity) !== loc.based_on_version,
      strings: loc.strings,
    };
  }
  return {
    format: BUNDLE_FORMAT,
    languages: repo.languages.languages,
    pivot: repo.languages.languages.find((l) => l.pivot)?.code ?? "en",
    concepts: [...repo.concepts.values()].filter((c) => c.status !== "deprecated").sort(byId),
    units: [...repo.units.values()].filter((u) => u.status !== "deprecated").sort(byId),
    routes: [...repo.routes.values()].filter((r) => r.status !== "deprecated").sort(byId),
    l10n,
    coverage,
  };
}
