# A1 Yes/No Questions Lesson Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a route-connected A1 lesson that teaches simple German yes/no question order.

**Architecture:** Author the existing planned concept and matching unit with en/ru/uk strings. The existing A1 route already contains the concept step, and the Home recommendation now skips completed lessons. Add a browser journey that seeds progress for the three preceding lessons and opens the new one.

**Tech Stack:** Existing YAML content contract, compiled content bundle, Next.js, Playwright, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-26-a1-yes-no-questions-design.md`

## Global Constraints
- Keep concept and unit `needs_review` until human gates pass.
- Keep en `draft`; keep ru and uk `machine_draft`.
- Use only current exercise formats and existing Home route behavior.
- Keep `route.core.a1_sentence_foundations` order unchanged.

## Review Focus
- Verb-first order is clear and contrasted with W-question and statement order; cover with the explanation, examples, and error-correction exercise.
- Finite verb form agrees with the subject; cover with matching and cloze exercises.
- Short answers preserve natural German and do not imply English-style auxiliary use; cover in examples and translation copy.
- Missing localization keys and invalid accepted answers are caught by `npm run content:validate`.
- Route completion reflects all answered exercise ids; cover with the Home journey after all earlier route units are seeded complete.

---

### Task 1: Yes/no question concept, lesson, and route journey

**Files:**
- Modify: `apps/web/e2e/journey.spec.ts`
- Modify: `content/concepts/syntax/concept.syntax.v1_yes_no_questions.yaml`
- Modify: `content/i18n/en/concept.syntax.v1_yes_no_questions.yaml`
- Modify: `content/i18n/ru/concept.syntax.v1_yes_no_questions.yaml`
- Modify: `content/i18n/uk/concept.syntax.v1_yes_no_questions.yaml`
- Create: `content/units/syntax/unit.syntax.v1_yes_no_questions.a1.yaml`
- Create: `content/i18n/en/unit.syntax.v1_yes_no_questions.a1.yaml`
- Create: `content/i18n/ru/unit.syntax.v1_yes_no_questions.a1.yaml`
- Create: `content/i18n/uk/unit.syntax.v1_yes_no_questions.a1.yaml`
- Modify: `docs/development/PROJECT_STATUS.md`
- Create: this spec and plan

**Interfaces:**
- Consumes: `route.core.a1_sentence_foundations` concept step `concept.syntax.v1_yes_no_questions` and Home route completion filtering.
- Produces: `unit.syntax.v1_yes_no_questions.a1`, resolved by the existing concept-to-unit route adapter.

- [ ] Add an E2E journey that seeds correct answers for the present-tense, V2, and W-question lessons, selects the A1 sentence route, and expects the next-step link to open `/en/learn/unit.syntax.v1_yes_no_questions.a1`.
- [ ] Author the concept as `needs_review`, bump concept/i18n pointers to `1.0.0`, and record pending linguistic, pedagogical, and rights review.
- [ ] Add a 9-exercise lesson with 8 supported formats: single choice (twice), match pairs, cloze, word order, transform, categorize, true/false, and error correction.
- [ ] Add complete en/ru/uk localization with draft states and `based_on_version: 1.0.0`.
- [ ] Update the project content counts and pending-review list.
- [ ] Run `npm run check`; all local checks must pass.
- [ ] Create a PR; require green full GitHub Actions CI including Playwright/axe before merging, then fast-forward local `main`.
