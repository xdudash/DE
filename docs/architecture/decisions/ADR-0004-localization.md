# ADR-0004: Localization — per-entity files, English pivot, explicit review states

- Status: Accepted (implemented in this PR)
- Date: 2026-10-12

## Context
Explanations in 5–10 languages from the start, with honest availability; translators/reviewers work per language; German facts must not be duplicated per language.

## Options considered
1. Inline maps in canonical files (`title: {en: …, ru: …}`) — simple, but files balloon, every translation touches canonical files, review per language is hard.
2. **Per entity × language files with `@key` references (chosen)** — canonical files stay German-only; each translation has its own status, translator, reviewer, `based_on_version`.
3. Gettext/ICU catalogs for all content — great tooling for UI strings, poor fit for long structured explanations tied to entities.

## Decision
Option 2 for learning content; ICU message catalogs for UI strings (library chosen in P2). English is the pivot (must be complete). Language registry with waves and flags in `content/languages.yaml`. Policy: [LOCALIZATION_POLICY.md](../../domain/LOCALIZATION_POLICY.md).

## Consequences
- + Coverage, staleness, and review state are machine-checkable; adding a language is data.
- − Keys must be maintained; validator reports orphan and missing keys.

## Verification
Validator: pivot completeness (error), coverage table, stale/orphan warnings; tests in `checks.test.ts` (implemented).
