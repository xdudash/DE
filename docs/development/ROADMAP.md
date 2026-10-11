# Development Roadmap

This roadmap defines dependencies rather than dates. Revise priorities when evidence changes.

## Phase 0 — Product and technical foundation
- Confirm product vision and MVP boundary.
- Define core user journeys and acceptance criteria.
- Design concept/content/learner-state model.
- Define lesson contract and review lifecycle.
- Compare technology options and record accepted decisions.
- Create Claude instructions, repeatable workflows, and repository checks.

**Exit:** no blocking ambiguity about the first learning journey, lesson model, data ownership, or quality process.

## Phase 1 — Content and engineering skeleton
- Implement the selected stack's smallest reproducible app/build.
- Establish schemas and deterministic validation.
- Create one gold-standard lesson and representative exercise types.
- Add CI/tests before bulk authoring.
- Build a small verified learning graph.

**Exit:** local build is reproducible; reference content validates; tests cover core contracts.

## Phase 2 — End-to-end learning loop
- Onboard learner, select goal/region/language.
- Run diagnostic or set starting point.
- Browse a concept and follow a lesson.
- Submit answers, receive feedback, and persist results.
- Display a transparent next-step recommendation.

**Exit:** one learner completes the journey with the persistence guarantee defined by the architecture.

## Phase 3 — Reading, vocabulary, and recall
- Add a rights-cleared reading pilot.
- Save contextual word senses and source metadata.
- Implement and test review scheduling.
- Link reading and exercises to the knowledge graph.

**Exit:** saved vocabulary is reviewable and evidence can influence recommendations.

## Phase 4 — Multilingual and skill breadth
- Implement the approved 5–10 explanation/interface languages under an explicit coverage policy.
- Add listening, writing, and speaking activities with honest assessment claims.
- Add DACH notes and reviewed examples.
- Expand content types only after QA is sustainable.

**Exit:** every claimed skill has a real activity/evaluation method and language coverage is disclosed accurately.

## Phase 5 — Pilot, freemium, deployment
- Test with a small learner cohort.
- Fix comprehension, usability, accessibility, and content problems.
- Finalize account/security/privacy/export/deletion needs.
- Implement free/premium entitlements and select a billing provider.
- Establish production monitoring, backup, recovery, release, and rollback.

**Exit:** release gates pass and support/maintenance obligations are understood.

## Phase 6 — Scale depth and breadth
- Extend knowledge graph and curriculum across CEFR levels.
- Expand vetted vocabulary, texts, dialogues, audio, and work/life scenarios.
- Improve diagnostics/personalization with evidence.
- Optimize infrastructure based on real usage and cost.
- Consider native mobile apps or specialized services when justified by demand.

## Reprioritization rules
- Optimize for verified coverage, quality, and learning outcomes, not lesson counts.
- Each feature needs user value and acceptance criteria.
- Do not expand bulk authoring before validation and review are sustainable.
- Do not scale infrastructure based only on hypothetical traffic.
