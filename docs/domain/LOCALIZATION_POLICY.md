# Localization Policy

Status: **Accepted** (2026-10-12). Decision record: [ADR-0004](../architecture/decisions/ADR-0004-localization.md). Machine registry: [`content/languages.yaml`](../../content/languages.yaml).

## Explanation/interface languages
| Wave | Languages | Rationale |
|---|---|---|
| 1 (launch) | **English** (pivot), **Ukrainian**, **Russian** | Primary audience (people from Ukraine and Russian-speaking migrants in DACH); English as global language of skilled workers/students and as authoring pivot; owner can supervise quality in all three. |
| 2 | Turkish, Arabic, Polish, Romanian | Largest migrant language communities in Germany/Austria; Arabic validates RTL from the start. |
| 3 | Persian (Dari/Farsi), Spanish | Afghan/Iranian communities (RTL); Latin American and Spanish skilled-worker migration. |

The registry is technically designed for 9 languages now; adding a language is data (`languages.yaml`) plus translations, not code. Wave order may change with user data.

## Three separate questions per language
1. **Technical support** — `ui` / `explanations` flags in the registry (fonts, RTL, plural rules, formatting).
2. **Availability** — for each entity, are all keys translated? (validator coverage report)
3. **Quality** — translation status per entity: `machine_draft → draft → needs_review → reviewed`.

## Rules
- English is the **pivot**: every key must exist in English (validator error otherwise). Other languages may be incomplete; missing keys fall back to English **with a visible notice**.
- A language is offered for a unit to learners only if that unit's localization is complete **and** `reviewed` (from R1 onward). Before R1, previews may show machine drafts with a banner.
- A language is advertised as "supported" only when every published unit of the advertised levels meets the rule above.
- German examples and facts are never translated in place; translations are glosses in the explanation language.
- Explanations are **written for the learner's language**, not word-for-word translated: they may add transfer-error notes (e.g. Russian/Ukrainian free word order → V3 errors). Divergent content must keep the same objectives and facts.
- AI translation is allowed as a **draft** (`machine_draft`); review by a competent bilingual reviewer is required for `reviewed` (status + reviewer recorded). Glossary per language for grammatical terminology lives in `docs/glossary/<lang>.md` (P2 task).
- Stale translations (canonical version bumped) are flagged and do not count as reviewed until re-confirmed.

## UI strings
Separate from learning content: message catalogs in the app (ICU MessageFormat when the i18n library is adopted in P2). Same wave plan; RTL layouts tested with Arabic in P2.
