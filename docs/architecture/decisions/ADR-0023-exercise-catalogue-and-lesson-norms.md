# ADR-0023: Exercise catalogue and lesson norms
- Status: Accepted (owner decision, 2026-10-24); 34 of 35 catalogue types are implemented end to end, with picture writing available as ungraded practice
- Date: 2026-10-24
- Decision owner: Project owner

## Context
Only four exercise types exist (single_choice, word_order, cloze, transform). Lessons written with them run for minutes, not the lesson length the owner expects. Each new type needs a schema entry, an evaluator rule, a UI component and tests, so the catalogue is built in the engine first, not in lesson text. Backlog items DG-045 and DG-054 are merged into this decision.

## Catalogue (35 types)
Status as of 2026-10-26: 34 of 35 catalogue formats are implemented end to end. `sentence_from_picture_prompt` remains planned for a human-review workflow; Writing Studio offers a local, ungraded picture-writing practice meanwhile. Audio exercises currently use browser speech; recorded audio assets remain future work.

| # | Type | Group | What the learner does | Status |
|---|---|---|---|---|
| 1 | single_choice | choice | Pick one answer | exists |
| 2 | multi_choice | choice | Pick all correct answers | exists |
| 3 | true_false | choice | Decide if a statement is right | exists |
| 4 | odd_one_out | choice | Find the word that does not belong | exists |
| 5 | article_input | input | Type der, die or das (or ein/eine) | exists |
| 6 | form_input | input | Type a conjugated form or plural | exists |
| 7 | gap_fill_input | input | Type the missing word in a sentence | exists |
| 8 | spelling_input | input | Type a word from a spoken or written prompt | exists |
| 9 | number_input | input | Write a number from digits or digits from words | exists |
| 10 | time_input | input | Write a time or date | exists |
| 11 | word_order | build | Put words in order | exists |
| 12 | keyword_build | build | Build a sentence from keywords | exists |
| 13 | verb_position | build | Mark the position of the finite verb | exists |
| 14 | token_bank_build | build | Build a sentence from a word bank | exists |
| 15 | match_pairs | match | Match two columns | exists |
| 16 | sort_into_groups | match | Sort words into categories | exists |
| 17 | join_halves | match | Join the two halves of a sentence | exists |
| 18 | transform | transform | Rewrite a sentence (change tense or form) | exists |
| 19 | negation | transform | Insert nicht or kein correctly | exists |
| 20 | separable_verb | transform | Split and place a separable verb | exists |
| 21 | connector_choice | transform | Choose und, aber or denn | exists |
| 22 | case_choice | transform | Choose the case form | exists |
| 23 | preposition_choice | transform | Choose the right preposition | exists |
| 24 | modal_choice | transform | Choose the right modal verb form | exists |
| 25 | error_correction | transform | Find and fix one error | exists |
| 26 | read_question | reading | Answer a question about a short text | exists |
| 27 | dialogue_gap | reading | Complete a dialogue | exists |
| 28 | reply_choice | reading | Choose the right reply to a line | exists |
| 29 | listen_choice | listening | Choose what was said using browser speech | exists |
| 30 | dictation | listening | Type a sentence spoken by browser speech | exists |
| 31 | minimal_pair | listening | Hear and choose between similar sounds with browser speech | exists |
| 32 | stress_mark | pronunciation | Mark the stressed syllable | exists |
| 33 | flashcard_recall | recall | Recall a word, then self-rate | exists |
| 34 | translation_input | recall | Type a short phrase in German from its meaning in the learner's language | exists |
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

Batches 1–4 are implemented on main. The open-ended picture prompt stays outside automatic scoring: Writing Studio stores its drafts locally and provides self-review until a human review workflow is available.

## Consequences
- Lessons are not written until the first batch exists, so the content matches the types.
- The number of exercise types grows with the engine, not with the lesson text.
