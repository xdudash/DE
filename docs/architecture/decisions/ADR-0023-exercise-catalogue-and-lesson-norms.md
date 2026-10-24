# ADR-0023: Exercise catalogue and lesson norms
- Status: Accepted (owner decision, 2026-10-24); types are implemented in batches (see below)
- Date: 2026-10-24
- Decision owner: Project owner

## Context
Only four exercise types exist (single_choice, word_order, cloze, transform). Lessons written with them run for minutes, not the lesson length the owner expects. Each new type needs a schema entry, an evaluator rule, a UI component and tests, so the catalogue is built in the engine first, not in lesson text. Backlog items DG-045 and DG-054 are merged into this decision.

## Catalogue (35 types)
Status: `exists` (implemented), `planned` (needs schema, evaluator, UI and tests). Audio types depend on ADR-0019 and DG-053.

| # | Type | Group | What the learner does | Status |
|---|---|---|---|---|
| 1 | single_choice | choice | Pick one answer | exists |
| 2 | multi_choice | choice | Pick all correct answers | planned |
| 3 | true_false | choice | Decide if a statement is right | planned |
| 4 | odd_one_out | choice | Find the word that does not belong | planned |
| 5 | article_input | input | Type der, die or das (or ein/eine) | planned |
| 6 | form_input | input | Type a conjugated form or plural | planned |
| 7 | gap_fill_input | input | Type the missing word in a sentence | planned |
| 8 | spelling_input | input | Type a word from a spoken or written prompt | planned |
| 9 | number_input | input | Write a number from digits or digits from words | planned |
| 10 | time_input | input | Write a time or date | planned |
| 11 | word_order | build | Put words in order | exists |
| 12 | keyword_build | build | Build a sentence from keywords | planned |
| 13 | verb_position | build | Mark the position of the finite verb | planned |
| 14 | token_bank_build | build | Build a sentence from a word bank | planned |
| 15 | match_pairs | match | Match two columns | planned |
| 16 | sort_into_groups | match | Sort words into categories | planned |
| 17 | join_halves | match | Join the two halves of a sentence | planned |
| 18 | transform | transform | Rewrite a sentence (change tense or form) | exists |
| 19 | negation | transform | Insert nicht or kein correctly | planned |
| 20 | separable_verb | transform | Split and place a separable verb | planned |
| 21 | connector_choice | transform | Choose und, aber or denn | planned |
| 22 | case_choice | transform | Choose the case form | planned |
| 23 | preposition_choice | transform | Choose the right preposition | planned |
| 24 | modal_choice | transform | Choose the right modal verb form | planned |
| 25 | error_correction | transform | Find and fix one error | planned |
| 26 | read_question | reading | Answer a question about a short text | planned |
| 27 | dialogue_gap | reading | Complete a dialogue | planned |
| 28 | reply_choice | reading | Choose the right reply to a line | planned |
| 29 | listen_choice | listening | Choose what was said (needs audio) | planned |
| 30 | dictation | listening | Type what was said (needs audio) | planned |
| 31 | minimal_pair | listening | Hear and choose between similar sounds (needs audio) | planned |
| 32 | stress_mark | pronunciation | Mark the stressed syllable | planned |
| 33 | flashcard_recall | recall | Recall a word, then self-rate | planned |
| 34 | translation_input | recall | Type a short phrase in German from its meaning in the learner's language | planned |
| 35 | sentence_from_picture_prompt | recall | Write a sentence for a prompt (free text, reviewed by a person) | planned |

Speaking is not in this catalogue; it needs a separate decision.

## Lesson norms (defaults the owner accepted; they can be changed)
- A0 lesson: 8–12 minutes, 15–25 exercises, at least 5 new words with example sentences.
- Each new type in a lesson counts toward the exercise count. Lessons use at least 4 types.
- Estimated minutes are counted from the exercise count and a fixed per-type time, not typed by hand.
- The validator reports a lesson that falls below the norm. It is a warning first and an error once the norm is in force for all levels.

## Implementation batches
1. **Batch 1 (engine and UI):** multi_choice, true_false, article_input, form_input, gap_fill_input, match_pairs, reply_choice.
2. **Batch 2:** spelling_input, number_input, time_input, keyword_build, token_bank_build, verb_position, negation, connector_choice, case_choice, preposition_choice.
3. **Batch 3:** the rest of the transform and reading types.
4. **Batch 4 (needs ADR-0019 audio):** listen_choice, dictation, minimal_pair, stress_mark.

Each batch is its own PR, with schema, evaluator tests (including wrong and empty answers), UI and an accessibility check. Lesson text is written only after batch 1 is merged.

## Consequences
- Lessons are not written until the first batch exists, so the content matches the types.
- The number of exercise types grows with the engine, not with the lesson text.
