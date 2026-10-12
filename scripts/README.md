# Scripts

- `check_foundation.py` — dependency-free check that required docs/files exist, CLAUDE.md stays concise, and relative Markdown links resolve.

Content tooling (validation, compilation) lives in `packages/content-kit` (`npm run content:validate`, `npm run content:build`). Keep scripts deterministic and non-zero on failure; avoid network access in required checks.
