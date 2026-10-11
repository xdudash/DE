---
description: Code quality and change-scope rules for implementation tasks
---
# Code quality rules

- Read the applicable architecture and product requirements before coding.
- Prefer the smallest coherent implementation; do not mix unrelated refactors into feature work.
- Keep domain logic testable and separate from presentation.
- Use stable IDs and typed interfaces/contracts instead of scattered magic strings.
- Handle loading, empty, error, and recovery states for user-facing asynchronous operations.
- Do not silently swallow exceptions or claim success after a failed operation.
- Never hardcode credentials, tokens, private URLs, or production data.
- Add or update tests when behaviour changes.
- Avoid dependencies unless they solve a real need; check maintenance, license, cost, and security.
- Do not change architecture or add a provider without a task/decision record.
- Do not deploy or run destructive production commands without explicit authorization.
