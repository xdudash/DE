# Content Contract v1

Status: **Accepted** (schema family v1, 2026-10-12). Decision record: [ADR-0003](../architecture/decisions/ADR-0003-content-format-and-pipeline.md). Implementation: [`packages/content-kit`](../../packages/content-kit/). Gold-standard reference: [`unit.syntax.v2_declarative.a1`](../../content/units/syntax/unit.syntax.v2_declarative.a1.yaml).

## 1. Format and layout
- **YAML 1.2** for all authored content (prose-friendly, comments, diff-friendly); parsed strictly (duplicate keys are errors; `.yml` is rejected). No JSON in `content/`. JSON is only the compiled output.
- Validated by **JSON Schema 2020-12** (`packages/content-kit/schemas/`) plus semantic checks in code.
- One canonical entity per file; **file name = entity id** (`concept.syntax.v2_declarative.yaml`).

```text
content/
  languages.yaml                      language registry (wave, ui, explanations, dir, pivot)
  sources.yaml                        machine-readable source registry (rights)
  concepts/<domain>/<concept-id>.yaml canonical knowledge (German-facing)
  units/<domain>/<unit-id>.yaml       pedagogical units (blocks + exercises)
  routes/<route-id>.yaml              recommended sequences
  i18n/<lang>/<entity-id>.yaml        explanation-language strings per entity
```
Later entity families (same rules, own schema tag): `lexicon/` (lemmas, senses, forms, collocations), `resources/` (texts, dialogues, audio manifests), `scenarios/` (communicative situations), `diagnostics/`.

## 2. Separation of concerns
| Layer | Lives in | Example |
|---|---|---|
| Canonical German facts | concept/unit YAML (`de`, `tokens`, `accept`, `pattern.schema_de`) | `"Seit Mai wohne ich in Berlin."` |
| Explanations, glosses, feedback | `i18n/<lang>/<entity>.yaml`, referenced as `"@key"` | `"@b.intro"` |
| Interface strings | app code (`apps/web/lib/ui-strings.ts`, later message catalogs) | "Check" button |
| Learner state | database (never in Git) | attempts, states |

A string value that matches `^@[a-z0-9][a-z0-9_.-]*$` is a localization key; German fields reject `@`-prefixed values by schema.

## 3. Identity and versioning
Three independent version axes:
1. **Schema family** — tag in every file (`schema: deutschgo.unit/1`). Breaking changes create `/2` with a migration script; the validator supports one family at a time.
2. **Entity version** — `version: MAJOR.MINOR.PATCH` per entity. PATCH: typo/wording; MINOR: added examples/exercises, compatible; MAJOR: changed meaning, removed exercises/objectives (learner evidence must be re-interpreted).
3. **Identity** — `id` never changes when titles, wording, or explanations change. Removal = `status: deprecated` (kept so learner history stays interpretable); a successor is linked with a `related_to` relation and noted in the PR.

ID grammar: `concept.<domain>.<name>`, `unit.<domain>.<name>.<level>`, `route.<track>.<name>`, `src.<name>`; local ids inside a file (`b_intro`, `x_order_rent`, `obj_identify`) are unique within the entity and stable as well, because learner evidence references `unitId#localId`.

Translations record `based_on_version`; a canonical version bump marks them **stale** (warning + coverage report) until re-confirmed.

## 4. Entities (v1)
### Concept (`deutschgo.concept/1`)
`kind` (grammar, morphology, lexeme_sense, collocation, pronunciation, orthography, pragmatics, discourse, regional), `domain`, `cefr.introduced/expected_mastery`, `relations[]`, `variety[]`, `register`, `pattern {schema_de, scope, limits}`, `examples[]`, `confusions[]`, `sources[]`, `review`.
- `status: planned` = graph placeholder (title/summary/CEFR/relations only); schema forbids content fields. Used to map the curriculum before authoring.
- Relations: **`depends_on` is the only prerequisite edge** (cycle-checked). `related_to`, `contrasts_with`, `commonly_confused_with`, `part_of` may be cyclic.

### Unit (`deutschgo.unit/1`)
`cefr`, `concepts[]` (taught; must not be `planned`), `prerequisites[]`, `goals[]`, `estimated_minutes`, `objectives[] {id, text, skill}`, ordered `blocks[]`, `sources[]`, `review`.
Block types: `explanation`, `pattern` (table; German cells), `examples` (with `highlight` token indices), `contrast` (pairs + point), `common_errors` (wrong/right/explanation), `regional_note`, `summary`, `exercises`.

### Exercise (inside an `exercises` block)
Common: `id`, `type`, `objective` (must exist), `concepts[]`, `prompt`, `difficulty 1–3`, `feedback {correct, incorrect, rules[]}`, `explanation`. A **rule** = list of normalized wrong answers → targeted feedback key + optional `signals` concept (diagnostic evidence).

| Type | Answer model | Validator self-checks |
|---|---|---|
| `single_choice` | options; exactly one `correct` | one correct; distractor feedback warning |
| `minimal_pairs` | spoken `audio_text_de` target with distinct German spelling options | exactly one correct option matching the target; unique ids and unique option spellings; correct answer evaluates correctly |
| `listening_choice` | `audio_text_de` spoken with the browser's German speech voice; learner chooses a localized meaning | one correct option; unique ids; every option has German text or a localization key; correct answer evaluates correctly |
| `dictation` | `audio_text_de` spoken with the browser's German speech voice; learner writes the full sentence | non-empty audio and accepted answer list; authored answer evaluates correctly |
| `error_correction` | `source_de` plus accepted corrected sentence(s) | non-empty source and answers; source is not an accepted answer; authored correction evaluates correctly |
| `categorize` | `categories[]` with localized labels; each German `items[]` entry maps to a category | unique ids; every category used; every item points to a known category; authored answer evaluates correct |
| `word_order` | `tokens` (≤9 chunks, display order), `accept` sentences, `final_punctuation` | every accepted sentence is buildable from the tokens and evaluates correct; rules don't shadow answers; tokens not pre-solved |
| `cloze` | `text_de` with `{{0}}…`, per-gap `accept` + rules | placeholders contiguous; gap rules don't shadow answers |
| `transform` | `source_de`, `accept` sentences | accepted answers evaluate correct; source not already an answer |
| `keyword_build` | `keywords`, `accept` sentences | each accepted sentence evaluates correct and uses every prompt keyword |
| `token_bank_build` | `tokens`, `solutions` (token index sequences), `final_punctuation` | each solution uses unique valid token positions, evaluates correct, and does not duplicate another sentence |

### Route (`deutschgo.route/1`)
Recommended, editable sequence of `unit` or `concept` steps (planned concepts allowed and shown as planned). Routes never contain teaching text.

### Localization (`deutschgo.l10n/1`)
`entity`, `lang`, `based_on_version`, `status` (`machine_draft` → `draft` → `needs_review` → `reviewed`), `translator`, `reviewer` (required when reviewed), `strings {key: markdown}`. Markdown subset: paragraphs, `- ` lists, `**bold**`, `*italic*`. No HTML.

## 5. Answer normalization (evaluator)
NFC; unify typographic quotes/dashes; trim/collapse spaces; drop space before punctuation; ignore final `. ! ?`; case-sensitive except the first letter. **ß ≠ ss** — Swiss spellings must be explicit accepted variants (editorial decision, see [regional varieties](./REGIONAL_VARIETIES.md)). Cloze gaps compare case-sensitively. The categorization evaluator grades each assignment and returns a partial score plus per-item feedback. Listening choice uses the same deterministic choice evaluator; speech playback is provided by the browser, with a visible transcript fallback when speech synthesis is unavailable. Dictation uses the shared sentence normalization and accepted-answer evaluator. Error correction uses accepted-answer normalization and can attach diagnostic rules to common incorrect sentences. Minimal pairs use a single-choice result after the learner listens to the spoken target and can replay each candidate. Evaluator version is 1.5.0. Tests: `packages/content-kit/test/evaluate.test.ts`.

## 6. Statuses and review gates
Entity status: `planned → draft → needs_review → approved → published → deprecated`. `approved`/`published` **require** `review.linguistic`, `review.pedagogical`, `review.rights` = `passed` (or `not_applicable` for rights) with reviewer and date — enforced by the validator. A published unit may only teach approved/published concepts. Process: [content review](../quality/CONTENT_REVIEW.md).

## 7. Validation and build
```bash
npm run content:validate   # schema + semantic checks + coverage table; non-zero on errors
npm run content:build      # refuses to build on errors; writes apps/web/generated/content.json
```
Checks: schema; file name = id; global id uniqueness; local id uniqueness; references (concepts, units, objectives, signals, sources); source approval; prerequisite cycles; undeclared prerequisites (warning); untested objectives (warning); route step order — a step whose prerequisites come later or never (warning); status gates; exercise self-checks; pivot completeness (error); non-pivot coverage (report); stale/orphan translation keys (warnings).

`npm run content:report` prints the curriculum coverage tables (per level, per strand, per language).

**Schema-valid ≠ correct German ≠ good pedagogy ≠ cleared rights.** Those are human gates.

## 8. Evolving the contract
Any change to schemas or semantics: update schema + types + checks + tests (valid and invalid fixtures) + this document in one PR; bump the schema family on breaking changes and include a migration script for existing content.
