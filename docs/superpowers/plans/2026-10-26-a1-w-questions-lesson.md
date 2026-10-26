# A1 W-Questions Lesson Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete, route-connected A1 lesson that teaches German W-question word order.

**Architecture:** Author the existing planned concept and a matching unit with localized learner-facing copy. The route already references the concept, and the web app maps concepts to matching units; add an E2E journey that verifies the next-step link after preceding route lessons are complete.

**Tech Stack:** YAML content contract, en/ru/uk localization files, Next.js E2E with Playwright, existing content validator.

**Spec:** `docs/superpowers/specs/2026-10-26-a1-w-questions-lesson-design.md`

## Global Constraints
- Keep concept and lesson in `needs_review` until human checks pass.
- Keep en copy in `draft`; keep ru and uk copy in `machine_draft`.
- Use existing exercise formats and the compiled content bundle; introduce no schema, dependency, or backend changes.
- The route continues to reference `concept.syntax.w_questions`; no route order change.

## Review Focus
- A completed earlier lesson must make W-questions the next available route lesson; cover with the Home recommendation journey.
- A W-question must keep the finite verb in position 2; cover with cloze, word-order, true/false, and correction exercises.
- `wer` as the subject has no extra subject after the verb; explain and exercise this separately from ordinary object-question inversion.
- `wo`, `wohin`, and `woher` ask different things; distinguish them in the explanation and matching exercise.
- Missing or stale language keys must fail validation; run the content validator after authoring all three localizations.

---

### Task 1: Route-to-lesson journey and A1 W-question content

**Files:**
- Modify: `apps/web/e2e/journey.spec.ts`
- Modify: `apps/web/test/path.test.ts`
- Modify: `apps/web/lib/path.ts`
- Modify: `apps/web/components/NextStepCard.tsx`
- Modify: `content/concepts/syntax/concept.syntax.w_questions.yaml`
- Modify: `content/i18n/en/concept.syntax.w_questions.yaml`
- Modify: `content/i18n/ru/concept.syntax.w_questions.yaml`
- Modify: `content/i18n/uk/concept.syntax.w_questions.yaml`
- Create: `content/units/syntax/unit.syntax.w_questions.a1.yaml`
- Create: `content/i18n/en/unit.syntax.w_questions.a1.yaml`
- Create: `content/i18n/ru/unit.syntax.w_questions.a1.yaml`
- Create: `content/i18n/uk/unit.syntax.w_questions.a1.yaml`
- Modify: `docs/development/PROJECT_STATUS.md`
- Create: this spec and plan

**Interfaces:**
- Consumes: `route.core.a1_sentence_foundations` step `concept.syntax.w_questions`, existing route-plan key `deutschgo.route-plan.v1`, and local attempt key `deutschgo.events.v1`.
- Produces: `unit.syntax.w_questions.a1`, attached to `concept.syntax.w_questions` and automatically startable through Home and the concept step.

- [x] Add a failing pure test proving completed route lessons are removed from Home's recommendation path while partially answered lessons remain.
- [x] Run the focused unit test and confirm it fails because `pendingRouteRecommendations` is not implemented.
- [x] Add an E2E case that seeds correct attempts for the present-tense and V2 units, selects `route.core.a1_sentence_foundations`, expects Home to recommend `/en/learn/unit.syntax.w_questions.a1`, opens it, and sees the lesson heading.
- [ ] Run the focused E2E case locally; attempted, but this environment lacks the Playwright Chromium binary. The same journey will run in GitHub CI.
- [x] Implement `pendingRouteRecommendations(route, lessonSteps, answered)` in `apps/web/lib/path.ts`, then use it in `NextStepCard` so route recommendation and Home rail share the all-exercises-answered completion rule.
- [x] Run `node --test --experimental-strip-types test/path.test.ts`; all route-state tests pass.
- [x] Change `concept.syntax.w_questions` from a placeholder to a `needs_review` authored concept with pattern, scope, limits, examples, confusion notes, source, and pending review fields; bump version and translation pointers to `1.0.0`.
- [x] Add a 9-exercise A1 unit teaching question-word position, verb-second order, answer categories, and `wo/wohin/woher`; include supported single-choice, match-pairs, cloze, word-order, transform, categorize, true/false, and error-correction formats.
- [x] Add complete en/ru/uk unit localizations with accurate draft statuses and version pointers.
- [x] Update project status counts and identify the new lesson as unreviewed.
- [x] Run `npm run check`; foundation, typecheck, all workspace tests, content validation, and production build pass. The full GitHub Actions CI remains the merge gate.
- [ ] Create a PR, merge it after CI passes, and fast-forward local `main`.
