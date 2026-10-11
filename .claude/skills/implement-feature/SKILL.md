---
name: implement-feature
description: Implement one bounded DeutschGo feature or GitHub issue by reading relevant docs, making a minimal change, running checks, and reporting evidence.
---
# Implement a feature

1. Read CLAUDE.md, the issue, and only relevant canonical docs.
2. Inspect current branch, working tree, adjacent code, and tests.
3. Confirm observable acceptance criteria. If an essential product/architecture decision is missing, propose a decision task before implementing.
4. Write a short plan and list expected files and risks.
5. Implement the smallest complete vertical slice; preserve behaviour outside scope.
6. Add/update focused tests and documentation.
7. Run focused checks, then any available broader checks.
8. Review the diff for accidental edits, missing states, and security/privacy issues.
9. Report files changed, actual commands/results, limitations, and the next dependency.

Do not deploy, delete data, or run destructive migrations unless explicitly authorized.
