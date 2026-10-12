# Curriculum Framework

Status: **Accepted** structure (2026-10-12); coverage targets are planning estimates to be refined from authored data.

## Levels and depth
CEFR A1–C1 is the product target; C2 is open-ended later work. Levels organise the curriculum but do not define the knowledge model: a concept has an *introduced* and *expected mastery* level and may be taught by several units of increasing depth (e.g. V2 at A1; V2 with subordinate clauses in position 1 at A2; topicalisation and information structure at B2).

## Strands
| Strand | Contains | Primary entity |
|---|---|---|
| S1 Morphology | verb conjugation, noun gender/plural, cases & declension, adjective endings, comparison, word formation | concept |
| S2 Syntax | V2/V1/verb-final, bracket, middle field, subordination, relative clauses, passive, infinitive clauses, participles | concept |
| S3 Lexicon | lemmas, senses, collocations, valency, phrasal patterns, false friends (per explanation language) | lexicon |
| S4 Pronunciation & orthography | sounds, minimal pairs, word stress, sentence melody, spelling rules, ß/ss (CH) | concept + audio |
| S5 Pragmatics & register | du/Sie, politeness, requests, complaints, emails/letters, phone calls | concept + scenario |
| S6 Discourse & text | connectors, text types, cohesion, argument | concept + resource |
| S7 Communicative scenarios | Behörden, Wohnen, Arbeit, Gesundheit, Bildung, Familie, Bank/Versicherung, Mobilität, Einkaufen, Freizeit, Medien | scenario |
| S8 Regional (DACH) | lexical/pragmatic differences, administrative procedures by country | concept (regional) + scenario |
| S9 Skills | reading, listening, writing, speaking activities | resource + exercise |

Reference frameworks used for **coverage checking only** (no copying): CEFR Companion Volume (Council of Europe), the German *Rahmencurriculum für Integrationskurse* (BAMF), exam specifications (Goethe, telc, ÖSD). Commercial inventories (e.g. Profile Deutsch, publisher word lists) are not reproduced; vocabulary lists are built from licensed frequency data plus editorial selection ([source register](../sources/SOURCE_REGISTER.md)).

## Coverage matrix (planning targets)
Counts are rough orders of magnitude used for planning and progress reporting; real numbers come from the validator.

| Level | Grammar/syntax concepts (S1–S2) | Vocabulary senses (S3) | Scenarios (S7) | Units (est.) |
|---|---|---|---|---|
| A1 | ~60 | ~700 | ~15 | ~60 |
| A2 | ~60 | ~1,300 | ~20 | ~70 |
| B1 | ~70 | ~2,400 | ~25 | ~90 |
| B2 | ~70 | ~4,000 | ~25 | ~90 |
| C1 | ~60 | ~6,000+ | ~20 | ~70 |

A generated coverage report exists: `npm run content:report` (add `-- --markdown` for a pasteable table) prints concepts per CEFR level and per strand with their status, units per level, and explanation-language completeness. Current state (2026-10-12): 67 concepts mapped at A1/A2 — 66 `planned`, 1 `needs_review` — in 15 strands, 1 unit, 2 routes, full en/uk/ru coverage of all titles and summaries.

## A1 inventory (mapped, DG-012)
The A1 graph is mapped as `planned` concepts so dependencies are visible before any
unit is authored: verbs (13), articles (5), cases (5), pronouns (4), prepositions (3),
nouns (3), adjectives (3), pronunciation (7), negation (2), numbers (2), time (2),
orthography (2), pragmatics (4), adverbs (1), questions (1), syntax (9 — the strand
the gold unit belongs to). Each carries `introduced` and `expected_mastery` levels, so
concepts that merely start at A1 (cases, participles, adjective endings) are not
claimed to be finished there.

## Routes
- `route.core.a1_core` — the main A1 journey in nine pedagogical blocks: first
  sentences → questions and negation → introducing yourself, numbers, time, politeness
  → accusative → modal and separable verbs → dative → the past → longer sentences →
  rounding off. Pronunciation and spelling are optional steps that can be woven in at
  any point.
- `route.core.a1_sentence_foundations` — a focused thread through sentence structure
  for learners who want grammar in one line.

The validator warns (`route.prerequisite_order`) when a step needs a concept the route
teaches later or never covers, unless a unit declares it as assumed knowledge.

## Authoring order
1. Map the concept graph per level as `planned` concepts (cheap; reveals dependencies early).
2. Author concepts and units along the A1 core route first (sentence structure → verbs → nouns/articles/cases → questions → modal/separable/perfect).
3. Interleave scenarios that apply the grammar (Behörden, Wohnen, Arbeit) so learners use German early.
4. Every batch passes [content review](../quality/CONTENT_REVIEW.md); bulk drafting is allowed only after the gold standard is approved, and only in batches that reviewers can actually review.

## Further routes (planned)
Goal routes (work, everyday, study, exam preparation) and scenario routes (Behörden,
Wohnen, Arbeit) follow once A1 units exist; they reuse the same concepts rather than
duplicating them.
