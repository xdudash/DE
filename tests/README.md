# Tests

Tests live next to the code they test:
- `packages/content-kit/test/` — unit tests (evaluator, graph, checks, l10n) and integration tests (real YAML + schemas, invalid fixtures). Run: `npm test`.
- `apps/web` — app logic tests and Playwright E2E arrive in P2 (DG-010, DG-013).

Levels and gates: [quality gates](../docs/quality/QUALITY_GATES.md). Editorial quality (German, pedagogy, translation, rights) is reviewed by humans: [content review](../docs/quality/CONTENT_REVIEW.md).
