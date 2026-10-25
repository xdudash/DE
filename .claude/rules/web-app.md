---
description: Rules for apps/web (Next.js) work
---
# Web app rules

- Read ARCHITECTURE.md module boundaries first. Teaching text never lives in components; it comes from the compiled bundle via `lib/content`.
- Only `lib/data` (from P2) talks to the database; components and learning logic stay provider-agnostic.
- Re-use `@deutschgo/content-kit/evaluate` for answer checking; never fork evaluation logic in the UI. The server re-evaluates every submitted attempt.
- Every user-visible state is honest: fallback and unpersisted banners stay until the condition is gone. Pre-launch exception (ADR-0022): draft, unreviewed and machine-translated labels are not shown to learners; the data statuses stay.
- German text gets `lang="de"`; layouts must work with `dir="rtl"`; interactive controls are keyboard operable with ≥44px targets.
- Server components by default; `"use client"` only for interactive parts; no secrets in client bundles (`NEXT_PUBLIC_` only for public values).
- Run `npm run typecheck -w @deutschgo/web` and `npm run build` after changes.
