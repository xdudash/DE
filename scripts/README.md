# Scripts

- `check_foundation.py` — dependency-free check that required docs/files exist, CLAUDE.md stays concise, and relative Markdown links resolve (skips `node_modules`, `.next` and test output).
- `foundation.py` — runs that check and its self-tests (`test_check_foundation.py`); CI runs it, `npm run foundation` runs it locally.
- `run-python.mjs` — starts a Python script with the first working interpreter (`python3`, `python` or `py`), so npm scripts also work on Windows.

Content tooling (validation, compilation) lives in `packages/content-kit` (`npm run content:validate`, `npm run content:build`). Keep scripts deterministic and non-zero on failure; avoid network access in required checks.
