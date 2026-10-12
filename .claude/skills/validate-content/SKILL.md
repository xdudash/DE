---
name: validate-content
description: Validate DeutschGo content after any change under content/ or packages/content-kit/schemas, interpret errors/warnings, and report language coverage.
---
# Validate content

1. Run `npm run content:validate` (add `-- --strict` to fail on warnings when preparing a release).
2. Fix errors in order: YAML/schema → file name/id → references → graph cycles → exercises → status gates → pivot localization.
3. Warnings: decide per item (stale translations need re-confirmation; untested objectives need an exercise; undeclared prerequisites need a `prerequisites` entry or a justification).
4. If a schema change is needed, stop and follow CONTENT_CONTRACT §8 (schema + types + checks + tests + docs in one PR).
5. Run `npm test -w @deutschgo/content-kit` if schemas or checks changed.
6. Report the counts line, the coverage table, and remaining warnings. Remember: validity ≠ correct German.
