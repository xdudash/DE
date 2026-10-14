# ADR-0009: Interface localization — typed catalogs with a minimal in-house ICU subset

- Status: Accepted (implemented in DG-014)
- Date: 2026-10-12
- Decision owner: Project owner

## Context
Interface strings (buttons, labels, banners) are separate from explanations of German, which live in `content/i18n/` under the content contract ([ADR-0004](./ADR-0004-localization.md)). The interface needs: plural rules for Slavic languages (one/few/many) and later Arabic (six categories), right-to-left layout from the start, type safety so a missing key cannot ship, and a cost that a solo founder can carry. The app is Next.js with React Server Components ([ADR-0001](./ADR-0001-application-platform.md)).

Message complexity is low: short labels with a number or a name. There are no dates, currencies, relative times or rich-text segments in the interface yet.

## Options considered
| | A. `next-intl` | B. `react-intl` / FormatJS | C. Typed catalogs + minimal ICU subset (chosen) |
|---|---|---|---|
| Message syntax | Full ICU | Full ICU | Interpolation, `plural`, `select`, `number` only |
| Bundle cost | Moderate | Larger (full parser) | ~150 lines, no dependency |
| Plural correctness | `Intl.PluralRules` | `Intl.PluralRules` | `Intl.PluralRules` (same source of truth) |
| Type safety of keys | Good (with setup) | Via helpers | Keys are a TypeScript union from the pivot catalog |
| RTL | App's concern either way | App's concern either way | App's concern either way |
| Routing/locale plumbing | Provided | Manual | Manual (already built: `/[lang]/…`) |
| Risk | Framework coupling; upgrades tied to Next majors | Heavier, React-centric | We own the parser: unsupported syntax must be added or avoided |

## Decision
Option **C**: `packages/i18n` holds one catalog per locale (`en` is the pivot and the key source of truth) and a formatter supporting `{name}`, `{n, number}`, `{n, plural, …}` (including `=0` exact arms and `#`), `{x, select, …}` and nesting inside arms. Plural categories come from `Intl.PluralRules`, so no rule tables are maintained. Unsupported syntax raises a `MessageError` at format time, and the test suite formats **every message of every catalog** with sample values, so a typo or a missing placeholder fails CI rather than reaching a learner.

Locale routing stays in the app (`/[lang]/…`, already present). `dir` comes from the locale registry in the same package. Arabic ships now as a **preview locale**: a complete catalog that exercises RTL and six-category plurals in tests and screenshots, but is excluded from the language picker until reviewed Arabic explanations exist.

## Consequences
- No dependency to upgrade, no bundle overhead, and the formatter is testable without a browser or a framework.
- We own a parser. Its scope is deliberately small; the moment the interface needs dates, currencies, relative time or rich-text segments, switching to a full ICU library is the expected move — catalogs are plain objects with ICU-compatible syntax, so the migration is mechanical.
- Catalog completeness and placeholder parity are enforced by tests, not by discipline.
- A missing key falls back to the pivot message (with pivot plural rules) rather than printing an identifier.

## Verification
`npm test -w @deutschgo/i18n`: formatter behaviour (en/ru/uk/ar plural categories, `=0`, nesting, number formatting, failure modes), and for every locale — exact key parity with the pivot, identical placeholders per key, every message formats, no message renders empty. RTL layout is verified in the web app's tests (DG-013).
