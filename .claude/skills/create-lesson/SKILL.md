---
name: create-lesson
description: Draft or revise a DeutschGo learning unit or concept under the content contract v1, using the V2 gold unit as calibration. Use only for batches the review process can absorb.
---
# Create or revise a unit

1. Read `docs/domain/CONTENT_CONTRACT.md`, `docs/domain/CONTENT_STANDARD.md`, and the gold unit `content/units/syntax/unit.syntax.v2_declarative.a1.yaml` (+ its `content/i18n/en/` file). Do not read other units unless needed.
2. Confirm: target CEFR, goal(s), concept ids (create `planned` concepts first if missing), prerequisites (`depends_on`), objectives, exercise types, explanation languages requested.
3. If the gold unit is not yet human-approved (see PROJECT_STATUS), produce at most the requested single unit — no batches.
4. Write canonical YAML: German only in `de`/`tokens`/`accept`/`text_de`/`source_de`; all explanation text as `@keys`.
5. Write the English pivot file; other languages as `status: machine_draft` only if requested. Add learner-language transfer notes where useful.
6. Exercises: every accepted variant listed; error rules for real misconceptions with `signals`; explanation per exercise; tokens not pre-solved.
7. `status: needs_review` at most; all `review.*: pending`. Sources: `src.deutschgo_original` or an approved source.
8. Run `npm run content:validate` and fix all errors; review warnings.
9. Run the `review-content` skill on the result and list unresolved points.
10. Report: ids, files, validator output summary, review points, and what still needs a human.
