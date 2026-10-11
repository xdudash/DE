# Scripts

Keep repeatable repository checks and content tooling here. Scripts must be deterministic, documented, and return a non-zero exit code when a required check fails.

## Current script
- check_foundation.py: dependency-free check that foundation files exist and relative Markdown links resolve.

## Future candidates
- Content schema validation.
- Stable-ID/reference and prerequisite-graph validation.
- Localization coverage checks.
- Source/provenance manifest checks.
- Duplicate/near-duplicate reports.
- Gold-standard fixture validation.

Avoid expensive or network-dependent checks in required CI without a clear reason. Prefer standard-library tooling for simple repository checks.
