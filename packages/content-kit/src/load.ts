/** Reads content/ from disk: strict YAML parsing + JSON Schema validation. */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020Module from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";
import { parseDocument } from "yaml";
import type { Concept, ContentRepo, Issue, LanguageRegistry, Localization, Route, SourceRegistry, Unit } from "./types.ts";

// CommonJS interop for both Node type-stripping and tsc (NodeNext).
type AjvCtor = typeof import("ajv/dist/2020.js").default;
const Ajv2020: AjvCtor = ((Ajv2020Module as unknown as { default?: AjvCtor }).default ?? Ajv2020Module) as AjvCtor;
type AddFormats = (ajv: InstanceType<AjvCtor>) => unknown;
const addFormats: AddFormats = ((addFormatsModule as unknown as { default?: AddFormats }).default ?? addFormatsModule) as unknown as AddFormats;

export const SCHEMA_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../schemas");

const SCHEMA_FILES: Record<string, string> = {
  "deutschgo.concept/1": "concept.schema.json",
  "deutschgo.unit/1": "unit.schema.json",
  "deutschgo.route/1": "route.schema.json",
  "deutschgo.l10n/1": "l10n.schema.json",
  "deutschgo.languages/1": "languages.schema.json",
  "deutschgo.sources/1": "sources.schema.json",
};

export function createValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
  addFormats(ajv);
  for (const f of readdirSync(SCHEMA_DIR).filter((x) => x.endsWith(".schema.json")).sort()) {
    ajv.addSchema(JSON.parse(readFileSync(join(SCHEMA_DIR, f), "utf8")));
  }
  return (schemaTag: string, data: unknown): string[] => {
    const file = SCHEMA_FILES[schemaTag];
    if (!file) return [`unknown schema tag "${schemaTag}"`];
    const id = `https://deutschgo.dev/schemas/${file}`;
    const validate = ajv.getSchema(id);
    if (!validate) return [`schema ${id} not loaded`];
    if (validate(data)) return [];
    return (validate.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message ?? "invalid"}${e.params && "allowedValues" in e.params ? ` (${(e.params.allowedValues as string[]).join(", ")})` : ""}`);
  };
}

function walk(dir: string): string[] {
  let out: string[] = [];
  let entries: string[];
  try { entries = readdirSync(dir).sort(); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out = out.concat(walk(p));
    else if (e.endsWith(".yaml")) out.push(p);
    else if (e.endsWith(".yml")) out.push(p); // reported as error below
  }
  return out;
}

export interface LoadResult {
  repo: ContentRepo;
  issues: Issue[];
}

export function loadContent(rootDir: string): LoadResult {
  const root = resolve(rootDir);
  const issues: Issue[] = [];
  const validate = createValidator();
  const repo: ContentRepo = {
    root,
    concepts: new Map(),
    units: new Map(),
    routes: new Map(),
    l10n: new Map(),
    languages: { schema: "deutschgo.languages/1", languages: [] },
    sources: { schema: "deutschgo.sources/1", sources: [] },
    files: new Map(),
  };
  const rel = (p: string) => relative(resolve(root, ".."), p);

  const read = (path: string, expected: string): Record<string, unknown> | undefined => {
    if (path.endsWith(".yml")) {
      issues.push({ severity: "error", code: "file.extension", file: rel(path), message: 'use ".yaml" extension' });
      return undefined;
    }
    const doc = parseDocument(readFileSync(path, "utf8"), { uniqueKeys: true, version: "1.2", prettyErrors: true });
    if (doc.errors.length) {
      for (const e of doc.errors) issues.push({ severity: "error", code: "yaml.parse", file: rel(path), message: e.message });
      return undefined;
    }
    const data = doc.toJS() as Record<string, unknown> | null;
    if (!data || typeof data !== "object") {
      issues.push({ severity: "error", code: "yaml.empty", file: rel(path), message: "file must contain a mapping" });
      return undefined;
    }
    if (data.schema !== expected) {
      issues.push({ severity: "error", code: "schema.tag", file: rel(path), message: `expected schema "${expected}", found "${String(data.schema)}"` });
      return undefined;
    }
    const errs = validate(expected, data);
    for (const m of errs) issues.push({ severity: "error", code: "schema.invalid", file: rel(path), message: m });
    return errs.length ? undefined : data;
  };

  const registerEntity = <T extends { id: string }>(map: Map<string, T>, path: string, data: T) => {
    if (basename(path, ".yaml") !== data.id) {
      issues.push({ severity: "error", code: "file.name", file: rel(path), entity: data.id, message: `file name must be "${data.id}.yaml"` });
    }
    const owner = repo.files.get(data.id);
    if (owner) {
      issues.push({ severity: "error", code: "id.duplicate", file: rel(path), entity: data.id, message: `id already defined in ${owner}` });
      return;
    }
    repo.files.set(data.id, rel(path));
    map.set(data.id, data);
  };

  const langs = read(join(root, "languages.yaml"), "deutschgo.languages/1");
  if (langs) repo.languages = langs as unknown as LanguageRegistry;
  const srcs = read(join(root, "sources.yaml"), "deutschgo.sources/1");
  if (srcs) repo.sources = srcs as unknown as SourceRegistry;

  for (const p of walk(join(root, "concepts"))) {
    const d = read(p, "deutschgo.concept/1");
    if (d) registerEntity(repo.concepts, p, d as unknown as Concept);
  }
  for (const p of walk(join(root, "units"))) {
    const d = read(p, "deutschgo.unit/1");
    if (d) registerEntity(repo.units, p, d as unknown as Unit);
  }
  for (const p of walk(join(root, "routes"))) {
    const d = read(p, "deutschgo.route/1");
    if (d) registerEntity(repo.routes, p, d as unknown as Route);
  }
  for (const p of walk(join(root, "i18n"))) {
    const d = read(p, "deutschgo.l10n/1") as unknown as Localization | undefined;
    if (!d) continue;
    const langDir = basename(dirname(p));
    if (d.lang !== langDir) issues.push({ severity: "error", code: "l10n.dir", file: rel(p), message: `lang "${d.lang}" must live in i18n/${d.lang}/` });
    if (basename(p, ".yaml") !== d.entity) issues.push({ severity: "error", code: "file.name", file: rel(p), message: `file name must be "${d.entity}.yaml"` });
    const key = `${d.lang}:${d.entity}`;
    if (repo.l10n.has(key)) issues.push({ severity: "error", code: "l10n.duplicate", file: rel(p), message: `duplicate localization ${key}` });
    else repo.l10n.set(key, d);
  }
  return { repo, issues };
}
