# German Knowledge Model

Status: **Accepted** (2026-10-12). Machine contract: [content contract](./CONTENT_CONTRACT.md).

## Purpose
Represent knowledge of German independently of lesson order, UI, and explanation language, so that units, routes, review, diagnostics, and search all reuse one source of truth.

## Layers
```text
  Language knowledge (canonical)     Pedagogy                Learner (database)
  ┌──────────────────────────┐   ┌─────────────────────┐   ┌───────────────────────┐
  │ Concept graph            │◄──│ Units (blocks,      │   │ Evidence events       │
  │  grammar, morphology,    │   │  examples,          │──►│ (attempt, result,     │
  │  syntax, pragmatics,     │   │  exercises)         │   │  recall, transfer)    │
  │  pronunciation, regional │   │ Routes (sequences)  │   │ Concept/skill states  │
  │ Lexicon                  │◄──│ Resources (texts,   │   │ Review schedule       │
  │  lemma → senses → forms, │   │  dialogues, audio)  │   │ Saved vocabulary      │
  │  collocations            │   │ Scenarios           │   │ Settings, goals       │
  └──────────────────────────┘   └─────────────────────┘   └───────────────────────┘
           ▲ explained by: Localizations (per language, per entity, with review state)
```

## Entities
| Entity | Status | Notes |
|---|---|---|
| Concept | v1 implemented | Stable unit of knowledge; typed relations; `planned` placeholders map the curriculum. |
| Unit | v1 implemented | Pedagogical treatment for a level/goal; may cover several concepts; several units may teach one concept at different depths. |
| Exercise | v1 implemented (4 types) | Inside units in v1; extraction into reusable exercise banks when a second unit needs the same items (schema `/2` candidate). |
| Route | v1 implemented | Editable recommendation; never owns definitions. |
| Localization | v1 implemented | Per entity × language; status + based_on_version. |
| Source | v1 implemented | Registry with license and allowed use; only approved sources may be referenced. |
| Lexeme / Sense / Form / Collocation | P4 | Lemma with POS, gender, plural, valency/case government, separable prefix; senses are the review unit; forms enable search and tap-to-lookup; frequency band from licensed corpus data. |
| Resource (text, dialogue, audio) | P4–P5 | Level, region, register, rights, transcript, aligned sentences, linked concepts/senses. |
| Scenario | P5 | Communicative situation (e.g., "registering an address in Vienna") linking pragmatics, vocabulary, resources, and region-specific procedures. |
| Diagnostic item bank | P4 | Calibrated items with concept links, versioned. |
| Learner evidence | P2 | See [learning engine](./LEARNING_ENGINE.md) and [data & privacy](../architecture/DATA_AND_PRIVACY.md). |

## Relationships
`depends_on` (the only prerequisite direction; acyclic), `related_to`, `contrasts_with`, `commonly_confused_with`, `part_of` (concept hierarchies, e.g. *Akkusativ-Präpositionen* part_of *Akkusativ*). Units link concepts via `concepts`/`prerequisites`; exercises link concepts and error rules may **signal** a concept, producing diagnostic evidence.

## Orthogonal axes
CEFR level (introduced / expected mastery), domain/strand, skill, goal, variety (standard, de-DE, de-AT, de-CH, regional), and register are independent tags. A concept may be revisited at several levels with increasing depth through different units.

## Invariants (validator-enforced)
IDs stable and language-independent; references resolve; no prerequisite cycles; a unit cannot teach a `planned` concept; approved content requires completed human review; explanations exist in the pivot language.
