# Review packet: gold unit `unit.syntax.v2_declarative.a1` (DG-007)

Status: **Prepared, not reviewed.** This packet tells human reviewers what to check and what the owner must decide. It records **no human review**. The AI pre-review in section 3 is a checklist aid under [CONTENT_REVIEW.md](./CONTENT_REVIEW.md), never a `review.*` status.

Files under review:
- Unit: [`content/units/syntax/unit.syntax.v2_declarative.a1.yaml`](../../content/units/syntax/unit.syntax.v2_declarative.a1.yaml)
- Concept: [`content/concepts/syntax/concept.syntax.v2_declarative.yaml`](../../content/concepts/syntax/concept.syntax.v2_declarative.yaml)
- Translations: `content/i18n/{en,uk,ru}/` (en is `draft`; uk and ru are `machine_draft`)

Automated status: the content validator (schema, references, graph, exercise self-check, localization coverage) passes in CI on `main` (run `38488698817`). This shows structure only. It does not show that the German is correct or that the teaching works.

## 1. What each gate needs

| Gate | Who | Question to answer | Recorded as |
|---|---|---|---|
| `review.linguistic` | German native or DaF/DaZ teacher | Is every German sentence correct, natural, and in the stated DACH variety? Are the rule's scope and limits accurate? | `review.linguistic` (reviewer handle, date, notes) |
| `review.pedagogical` | Teacher of adult A1 learners | Is the load right for A1? Does each exercise test its objective? Do error rules match real misconceptions? | `review.pedagogical` |
| Translation (uk, ru) | Native speaker with solid German | Is meaning and register preserved; is the terminology consistent? | l10n `status: reviewed` per language |
| `review.rights` | Owner | Is every German sentence authored for DeutschGo, with no external source? | `review.rights` |

A reviewer must not also be the author or the gate-holder for the same gate ([CONTENT_REVIEW.md](./CONTENT_REVIEW.md), roles table).

## 2. Items for the linguistic reviewer

Please check each sentence, its accepted variants, and its feedback text.

- **Pattern table** (`b_pattern`): five rows. Confirm that the rows show the intended V2 structure and that the empty cells are right.
- **Examples** (`b_examples`): `Ab nächster Woche arbeite ich in Linz.`, `Beim Arzt muss man oft lange warten.`, `Diese Wohnung finde ich zu teuer.`, `Heute fängt der Deutschkurs um neun Uhr an.`, `Gestern habe ich meine Steuererklärung abgeschickt.`
- **Contrasts** (`b_contrast`): `Heute arbeite ich im Homeoffice.`; `..., und ich lerne Deutsch.` vs `..., deshalb lerne ich Deutsch.`
- **Common errors** (`b_errors`): each `wrong` form must be really ungrammatical or really unnatural. Each `right` form must be correct.
- **Word-order exercises** (accepted variants):
  - `x_order_vienna`: the variant `Ich fahre nach Wien morgen.` is **not** accepted. Is it natural enough to accept, or is it correctly rejected?
  - `x_order_rent`, `x_order_call`: confirm all accepted variants, and that the rejected forms are the ones the feedback names.
  - `x_transform_evening`: only `Heute Abend gehe ich ins Kino.` is accepted. Are other natural rewrites possible that should be accepted?
- **Cloze** (`x_cloze_deshalb`): the only accepted fills are `lerne` and `ich`.
- **Transforms** (`x_transform_aber`, `x_transform_deshalb`): check the comma variant `..., deshalb nehme ich ...` as accepted.
- **Single choice** (`x_choose_correct`, `x_position2`, `x_limits`): confirm that exactly one option is correct for the prompt as written.
  - `x_limits` asks for the sentence where the verb is **not** in position 2. Its correct answer is `Kommst du morgen?` (a yes/no question). The distractors `Morgen komme ich.` and `Ich komme morgen.` are V2 statements, and `Wann kommst du?` is a W-question, which is also V2. Confirm the prompt makes this unambiguous for A1.
- **Regional note** (`b_regional`): the unit says `variety: standard`, but the examples use Berlin, Linz, Graz, Wien and Zürich. Confirm that this mix is acceptable and that the note states it.

## 3. AI pre-review (checklist aid, not a human review)

Checks run by Claude while preparing this packet:

- **Highlight indices** are 0-based token indices of the finite verb. They were checked in every example and contrast and are consistent (for example `Ab(0) nächster(1) Woche(2) arbeite(3)`, highlight `[3]`).
- **Exercise answer keys**: every `accept` entry was read against its tokens or source sentence. Each listed answer is grammatical V2 with the verb in position 2, except where the exercise asks for another position.
- **Error rules** match the errors the exercise is designed to show (V3 error, verbal bracket, subject-adverb order, position-0 subject inversion).
- **No clear German error was found.** The open points above are judgement calls for a human reviewer, not confirmed errors.

## 4. Items for the pedagogical reviewer

- **Load:** the unit has 10 exercises, 4 explanation blocks and an estimated 25 minutes. Is that realistic for absolute beginners? The unit's own note flags that the position-0 and limits sections may be too dense.
- **Order:** `b_position0` and `b_limits` come after the main pattern. Is the sequence right?
- **Objectives:** do the four objectives (`obj_identify`, `obj_produce`, `obj_position_zero`, `obj_limits`) each have at least one exercise? (They do in the file; confirm they test what they name.)
- **Prerequisite:** only `concept.morph.verb_present_conjugation`. Is that enough, or does the unit need a word-order or pronoun prerequisite?
- **Common errors:** are these the errors A1 learners actually make, based on teaching experience?

## 5. Items for translation reviewers (uk, ru)

Only after the German is settled, because translations depend on it.

- Check the unit's `summary`, objective texts, and every `@b.*`, `@x.*`, `@fb.*` string.
- Check that the terminology matches the language glossary for the grammar terms (V2, position 0/1/2, verbal bracket).
- `x.limits.prompt` in uk and ru says "NOT in position 2": check the negation and the wording.

## 6. Decisions for the owner

1. **Reviewers.** Name a German linguistic reviewer, a pedagogical reviewer, and a uk and a ru reviewer. Without them DG-007 cannot close.
2. **Rights.** Confirm that all German sentences in the unit and concept were written for DeutschGo and use no external source (`review.rights`).
3. **Scope of this unit.** Keep the `x_limits` item as it is, or simplify it? (The reviewer's answer decides.)
4. **After review.** If the reviewers accept the unit, the owner sets `review.*` and the statuses. The AI must not set them.

## 7. How to record findings

Use this form in the PR review thread, or in the review form in P2:

```text
Unit: unit.syntax.v2_declarative.a1
Item: <block id or exercise id, e.g. x_order_vienna>
Severity: blocker | major | minor | suggestion
Finding: <what is wrong and why>
Proposed fix: <text, or "needs discussion">
Reviewer: <handle>  Date: <YYYY-MM-DD>
```

Blockers stop the unit from being approved. Majors must be fixed before approval. Minors and suggestions can wait.

## 8. What is needed to close DG-007

1. A linguistic and a pedagogical reviewer have recorded findings, and each blocker and major is fixed or rejected with a reason.
2. The owner has confirmed rights.
3. uk and ru have been reviewed by native speakers.
4. The owner sets `review.*` and the statuses in the content files, in a PR.
5. Any change to the content contract or the content standard that the review causes is a contract v1.x change under [CONTENT_CONTRACT.md §8](../domain/CONTENT_CONTRACT.md).
