# Content Review Workflow

Status: **Accepted** (2026-10-12). Statuses and gates: [content contract §6](../domain/CONTENT_CONTRACT.md).

## Why
Automated validation proves structure, references, buildable answers, and coverage. It cannot prove that German is correct and natural, that explanations teach well, that translations are faithful, or that rights are clear. Those are separate, recorded human gates.

## Roles (one person may hold several, but not author + reviewer for the same gate)
| Role | Gate | Qualification |
|---|---|---|
| Author (often Claude + owner) | — | follows [content standard](../domain/CONTENT_STANDARD.md) |
| Linguistic reviewer | `review.linguistic` | native/near-native German, DaF/DaZ teaching or linguistics background preferred; DACH variety awareness |
| Pedagogical reviewer | `review.pedagogical` | experience teaching German to adults at the target level |
| Translation reviewer (per language) | l10n `status: reviewed` | native speaker of the explanation language with solid German grammar knowledge |
| Rights reviewer (owner) | `review.rights` | checks sources against [source register](../sources/SOURCE_REGISTER.md) |

AI may assist every role (pre-review checklists, suspicious-sentence detection, back-translation), but an AI pass is never recorded as a human review.

## Lifecycle per unit
1. **Draft** (`draft`) — author writes canonical YAML + pivot (en) strings; runs `npm run content:validate`.
2. **AI pre-review** — Claude runs the `review-content` skill; findings fixed or noted.
3. **Ready** (`needs_review`) — PR labelled `content-review`; preview deployment link in PR (P2).
4. **Human reviews** — reviewers comment in the PR (or a review form in P2); each finding classified blocker/major/minor/suggestion with content id + field.
5. **Record** — after fixes, reviewers' names/dates are written into `review.*` (reviewer handle, date, notes). Validator enforces completeness for `approved`.
6. **Translations** — each language moves `machine_draft → draft → needs_review → reviewed` independently.
7. **Publish** — `published` when the unit and all concepts it teaches are approved and the target languages meet the [localization policy](../domain/LOCALIZATION_POLICY.md).
8. **Maintenance** — learner error reports and analytics (frequent "wrong" answers that are actually correct) open `content:` issues; MAJOR version bumps reset affected reviews.

## Batch sizing
After the gold standard is approved, drafting proceeds in batches no larger than reviewers can complete within two weeks (start: 5 units). Throughput of **review**, not generation, sets the pace.

## Reviewer checklist (summary)
- German: correct, idiomatic, level-appropriate, variety/register labelled; examples natural in DACH context.
- Rule: scope stated, limits/exceptions accurate, no false "always".
- Exercises: each tests its objective; all valid answers accepted; error rules diagnose real misconceptions; feedback explains.
- Translation: meaning and register preserved; terminology consistent with the language glossary.
- Rights: every non-original sentence/asset has an approved source with attribution.

## Gold standard
`unit.syntax.v2_declarative.a1` is the calibration item. Its review outcome (DG-007) may change the contract (v1.x) and the content standard before any batch production.
