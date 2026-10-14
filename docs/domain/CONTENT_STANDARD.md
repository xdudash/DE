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
