---
name: release-check
description: Check a DeutschGo pull request or release for scope, tests, content validation, security, documentation, and known limitations.
---
# Release check

1. Read the PR, acceptance criteria, quality gates, and relevant architecture decisions.
2. Confirm intended files changed and the diff contains no secrets or private learner data.
3. Run available and appropriate checks; record exact outcomes.
4. Validate content/schema/references where applicable.
5. Review migration, privacy, retention, configuration, rollback, and backup implications when relevant.
6. Check documentation and release notes for behaviour or limitation changes.
7. List blockers separately from warnings and unverified risks.
8. Do not approve/merge with failing required checks or unresolved blockers. Do not deploy without explicit authorization.

Return a concise, evidence-based checklist. Never claim live production was tested when only local or CI checks ran.
