# Tests

Final test tooling depends on the approved application stack. Keep test levels distinct:

- Unit: isolated domain functions such as exercise evaluation, prerequisite graph logic, review scheduling, and localization resolution.
- Integration: persistence/service boundaries, content loading, and learner-progress updates.
- Content: schema validation, ID/reference integrity, graph constraints, localization completeness, and exercise answer contracts.
- End-to-end: setup, topic navigation, lesson attempts, vocabulary saving/review, progress, and settings.
- Editorial review: German quality, pedagogy, translations, accessibility, and rights cannot be fully proven by code tests.

When behaviour changes, include a meaningful regression test. Record what was not tested. Do not create empty test frameworks until the stack and test runner are chosen.
