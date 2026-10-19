# ADR-0011: End-to-end and accessibility testing — Playwright with axe-core

- Status: Accepted (implemented in DG-013)
- Date: 2026-10-19
- Decision owner: Project owner (decision delegated to the delivery agent for DG-013 under the owner's instruction of 2026-10-19; reversible)

## Context
[ARCHITECTURE](../ARCHITECTURE.md) and [QUALITY_GATES](../../quality/QUALITY_GATES.md) require journey tests in a real browser and an accessibility check (WCAG 2.2 AA target, keyboard operation, 44px targets, RTL). Until now the web app was covered by unit tests and a static build only. Nothing proved that a learner can answer an exercise in a browser, that German text carries `lang="de"`, or that the Arabic preview lays out right-to-left at phone width.

## Options considered
| | A. Playwright Test + `@axe-core/playwright` (chosen) | B. Cypress | C. Manual checklist only |
|---|---|---|---|
| Browser engines | Chromium, Firefox, WebKit | Chromium-family first | — |
| Runs in CI on GitHub Actions | Yes, with `playwright install --with-deps` | Yes | — |
| Accessibility checks | axe-core rules, same engine as the industry standard | Plugin, less maintained | Not repeatable |
| Native app path (Capacitor, P8) | Same test code can target the shell | Similar | — |
| Licence | Apache-2.0 / MPL-2.0 (axe-core) | MIT | — |

Option C fails the Definition of Done in `docs/development/PROJECT_MANAGEMENT.md`. Option B adds a runtime that is less suited to WebKit checks, which matter for iOS.

## Decision
- **Playwright Test** runs browser journeys. Tests live in `apps/web/e2e/` and run against the production build (`next start`), not the dev server, so they test what ships.
- **`@axe-core/playwright`** runs WCAG 2.0/2.1/2.2 A and AA rules on each page. The gate fails on `serious` and `critical` violations. Lower-impact findings are reported, not gated, so that the gate stays strict where it matters and does not block on noise.
- Two projects: desktop Chromium, and a phone-width Chromium project (390 px) that checks for horizontal page scroll.
- E2E runs in a separate CI job, `e2e`, after `npm run build`. It does not need a database: the preview build is expected to answer exercises without saving progress, and the test asserts that honest banner.
- No hosted service is used for E2E. Preview deployments on Vercel (the rest of DG-013) are a separate decision and are not part of this ADR.

## Consequences
- Two new dev dependencies in `apps/web`. Both are maintained by Microsoft and Deque, and both are in the permissive licence families above. Review on each upgrade.
- CI installs a Chromium build (about 150 MB) on each E2E run. Acceptable at this scale; revisit if the job exceeds 10 minutes.
- Tests assert user-visible behaviour (roles, labels, banners), not implementation classes, so refactoring the UI should not break them.
- Firefox and WebKit are not in the first set. Add them as a project when the app has a mobile-browser target (P5/P8), with a recorded decision.

## Related
- [ADR-0009](./ADR-0009-ui-i18n.md): interface strings that the tests read.
- [QUALITY_GATES](../../quality/QUALITY_GATES.md): where the E2E and accessibility gates are listed.
