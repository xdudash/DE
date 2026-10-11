# Quality Gates

## Principle
A green build proves only the checks that actually run. Automated structure validation cannot prove German naturalness, teaching effectiveness, or legal reuse rights.

## Every change
- Scope matches the task and acceptance criteria.
- No credentials, secrets, or real learner data are committed.
- Diff is reviewed for accidental edits.
- Relevant lint/type/build/tests are reported truthfully.
- New behaviour has tests or an explicit reason testing is not applicable.
- No unrelated refactor is hidden in the change.

## Foundation checks
- Required project files exist.
- Relative Markdown links resolve.
- Global Claude instructions remain concise and point to canonical docs.
- Workflows use minimal permissions.
- Documents distinguish decided, proposed, and unresolved choices.

## Content-data checks (as tooling is implemented)
- Every record validates against a versioned schema.
- IDs are unique and references resolve.
- Required fields and localization statuses are present.
- Prerequisite relationships have no invalid cycles.
- Exercise keys/rubrics are structurally complete.
- External content has source/license metadata.
- Duplicate/near-duplicate detection runs where useful.
- Invalid data exits with a non-zero status.

## Linguistic and pedagogical review
- German correctness and naturalness reviewed by a competent reviewer.
- Translation meaning, register, and explanation accuracy reviewed.
- Examples fit the declared variety and level.
- Exercises measure the objective and feedback is sound.
- Exceptions and accepted alternatives are accurate.
- Rights/provenance reviewed for sourced material.
- Review status is recorded. Automation alone cannot approve content.

## End-to-end learning journey
Test learner setup/diagnostic, topic navigation and prerequisite guidance, lesson attempts/feedback, reading/vocabulary save/review, progress/recommendations, language/region changes, mobile layout, keyboard accessibility, and failure/recovery states as the product supports them.

## Release
- Required checks pass.
- Migrations and rollback reviewed where applicable.
- Environment/secrets documented.
- Backup, monitoring, privacy, export/deletion, and recovery addressed before production data.
- Release notes and known limitations recorded.
- Production deployment requires explicit authorization.

## Failure handling
Fix the earliest meaningful failure first, rerun the focused check, then broader checks. Do not weaken or delete a test merely to get a green result.
