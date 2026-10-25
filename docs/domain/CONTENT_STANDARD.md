# Content Standard

## Purpose
Define the editorial and pedagogical quality bar before producing lessons at scale. Every published unit must teach a clear objective and help learners understand and apply German, not merely reveal answers.

## Required learning-unit fields
Defined and enforced by the [content contract](./CONTENT_CONTRACT.md) (schema family v1). Calibration item: [`unit.syntax.v2_declarative.a1`](../../content/units/syntax/unit.syntax.v2_declarative.a1.yaml). Review workflow: [content review](../quality/CONTENT_REVIEW.md).

## Explanation quality
A strong explanation:
1. Orients the learner to the phenomenon.
2. States the usable rule/pattern and its scope.
3. Shows natural German examples with contextual meaning.
4. Contrasts forms that learners may confuse.
5. Explains meaningful exceptions and variation without overwhelming the level.
6. Notes relevant learner-transfer errors.
7. Lets the learner apply the knowledge in context.

Avoid circular definitions, unexplained terminology, unnatural literal translations, and claims such as “always” when real exceptions matter. Label regional, colloquial, formal, and dated language.

## Exercise quality
- Each exercise tests its stated objective.
- Every question has a defensible answer or explicit open-response rubric.
- Distractors are plausible and tied to misconceptions.
- Accepted variants and partially correct answers are modeled where relevant.
- Feedback explains the reason.
- The prompt does not accidentally reveal the answer.
- Difficulty changes for a pedagogical reason; repetition adds value.

## Examples and translation
German must be idiomatic for its declared context and variety. Translations preserve meaning and register, not only word order. Distinguish lemma, word form, and contextual sense. Explicitly label valid alternatives.

## Multilingual workflow
Canonical language facts and German examples are independent of explanation language. Each explanation language has a translation/review state. Translation completeness should be machine-checkable where practical. AI-generated translations are drafts until reviewed.

## External sources and assets
Record origin, exact URL/identifier, version/access date, license/terms, attribution, and permitted use. Public accessibility is not permission to reproduce. Do not commit commercial books/course material/audio without permission. Keep a reference link instead of copying when reuse is not permitted or unclear.

## Review lifecycle
Use explicit statuses such as draft, needs_review, approved, published, and deprecated. Unreviewed content must never silently appear approved. Structural validation and linguistic/pedagogical review are separate required gates.

## Learner-language awareness
Explanations name typical transfer errors for the learner's language (e.g. free word order in Ukrainian/Russian → verb-third errors after a fronted adverbial). Such notes live in the explanation-language file; the German facts stay canonical.

## Gold-standard lesson
The V2 unit is the reference: precise rule with scope and limits, pattern table, everyday DACH examples with highlighted forms, contrasts, position-0 vs position-1 connectors, typical errors, regional note, summary, and ten exercises of four types with accepted variants, error rules that signal concepts, and explanations. Bulk production starts only after its human review (DG-007).

## Lesson standard (A0)
Agreed norms (ADR-0023 and its amendment of 2026-10-25), enforced by the validator through [`norms.ts`](../../packages/content-kit/src/norms.ts). A finding is an error, except for the units listed in `NORM_EXEMPT` with their reason. How lessons are produced: [lesson production plan](./LESSON_PRODUCTION_PLAN.md). Batch reference lesson: [`unit.lex.a0_0113_begruessung_hallo_guten_tag`](../../content/units/lexicon/unit.lex.a0_0113_begruessung_hallo_guten_tag.yaml) (a draft; it shows the form, it is not reviewed German).

### Structure
1. One subtopic, with a content title that no other lesson uses.
2. A short introduction: what the learner will be able to do and the one rule they need.
3. At least five examples: new words in short natural phrases or sentences ("Guten Tag, Frau Weber!"), each with a gloss that gives the meaning and, where useful, when it is used.
4. An optional tip for the most common confusion, and a summary of one or two lines.
5. 15–25 exercises.

### Exercises
| Rule | Code |
|---|---|
| 15–25 exercises | `norm.exercise_count` |
| At least 4 types; aim for 6 or more | `norm.type_variety` |
| Never two exercises of the same type next to each other | `norm.adjacent_type` |
| Never three of the same shape in a row (option lists: single, multi, true/false, reply; text boxes: all inputs, cloze, transform) | `norm.shape_run` |
| One type at most three times, and at most a quarter of the exercises | `norm.type_share` |
| The same answer (correct option, accepted text, cloze gaps) at most twice | `norm.repeated_answer` |
| The same question wording at most twice; numbers, quoted text and German words do not make a question new ("Which word means 30?" and "…40?" are the same question) | `norm.prompt_template` |
| Every wrong option has its own feedback that names the mistake; a true/false item explains the wrong pick | `norm.distractor_feedback`, `norm.generic_feedback` |
| At least 5 examples | `norm.examples` |
| `estimated_minutes` from the formula below, and 8–12 minutes | `norm.minutes_mismatch`, `norm.minutes_range` |
| Unique title | `norm.duplicate_title` |
| Two neighbouring A0 lessons on a route share the exercise type at no more than half of the positions, so lessons do not all follow the same rhythm | `norm.route_rhythm` |

Not checked by a tool, and required all the same (the independent review of 2026-10-25 found each of these in the first batch):
- No exercise practises the same thing as another one under new wording ("Write / Spell / Type the word for …" three times is one exercise three times).
- The prompt, the line or the stem does not show the answer ("Wie schreibt man „Bier“?" with the spelling as the answer).
- Rules are not stated as absolute when the route soon shows an exception: "usually" plus the exception (ie is long — but vierzehn, vierzig; st at the start of a word or word part — Hauptstraße, verstehen).
- Where spelling and sound differ in a word the lesson teaches, the lesson says so (sechzehn, sechzig with the ich-sound; -ig said -ich in Germany, -ik in the south, Austria and Switzerland).
- True/false statements and German prompts use only words the learner knows, or gloss a new word in the prompt itself (höflich = polite).
- Swiss spellings (ss for ß) and ae/oe/ue for umlauts are not marked wrong where earlier lessons taught them.
- German to be read goes into `stem_de`, `line_de` or `statement_de`, never into a translatable prompt.
- A distractor is a real learner error (dreizehn for 30), not an invented word, unless the invented form is itself the typical error (sechszehn).
- Each item has one defensible answer (for multi-choice, one defensible set) and can be answered from this lesson or earlier lessons.
- Every correct variant is accepted (Tschüss and Tschüs). Answers are compared case-sensitively except for the first letter; final `.`, `!` and `?` are ignored; commas inside the answer count. Typical misspellings get an error rule with feedback (sechszehn → sechzehn).
- Distractors are real confusions at this level (dreizehn for 30), not random words.
- German a learner has not met yet appears only as a glossed chunk, and the chunk is named in `review.pedagogical.notes`.
- The order builds up: recognise, then choose, then produce, then use in a short scene.

### Minutes
`estimated_minutes = round((sum of exercise seconds × 1.2 + reading seconds) / 60)`. Exercise seconds: single choice 15, true/false 12, multi-choice 22, reply 18, match 35, word order 30, cloze 25, transform 35, article 15, form 22, gap fill 22, spelling 22, number 15, time 18. Reading: 30 per explanation block, 10 per example, 40 per pattern table, 20 per contrast pair, common error or regional note, 20 for a summary block. These are estimates, not measurements (DG-067).

### Translations
en is the pivot. uk and ru are written in natural Ukrainian and Russian, at the learner's level, and stay `machine_draft` until a human reviews them. A transfer note for Ukrainian or Russian speakers goes into the explanation where it helps.
