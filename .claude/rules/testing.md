---
description: Testing and verification requirements for code and content changes
---
# Testing rules

- Find the narrowest relevant automated check and run it after a change.
- Run broader checks when practical and report exactly what was run.
- Never describe an unrun check as passed.
- Add regression coverage for fixed bugs where practical.
- Test edge cases, invalid input, empty states, and failure paths, not only happy paths.
- For content changes, validate schemas and references; syntax validity does not prove pedagogical correctness.
- For recommendations/scoring, use deterministic fixtures and test why results occur.
- If a check fails, investigate and report it; do not weaken or delete it merely to obtain a green result.
