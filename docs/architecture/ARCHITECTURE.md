# Architecture — Principles and Decisions

## Status
Architecture principles are being defined; the implementation stack is intentionally **not selected yet**. This is a decision checklist, not an implied commitment to a framework or provider.

## Boundaries
Keep these domains separate, even if the first release uses a modular monolith:
1. Presentation: responsive UX, navigation, accessibility, localization.
2. Learning domain: knowledge graph, routes, diagnostics, exercise evaluation, progress, review scheduling.
3. Content domain: language concepts, lessons, exercises, texts, dialogues, localization, sources, and media metadata.
4. Application services: orchestration, business rules, and permissions.
5. Persistence/integrations: profiles, progress, content delivery, audio, optional AI, analytics, billing.
6. Quality tooling: schema validation, content checks, tests, builds, and release automation.

Presentation components must not become the canonical storage format for teaching content. The learning model must not be coupled to one screen.

## Constraints
- Start with a modular monolith unless evidence supports independent services.
- Use stable IDs, not localized titles, as identifiers.
- Version schemas; document compatibility and migrations.
- Separate canonical German content from explanation translations and UI strings.
- Keep source/rights metadata with imported content.
- Store learner state separately from authored content.
- Make recommendations explainable and testable before opaque personalization.
- Minimize personal data and define retention/export/deletion before production.
- Keep secrets outside the repository.
- Make local setup reproducible.
- Add abstractions only when they address a real boundary or expected change.

## Decisions required before implementation
For each area, compare realistic options, solo-developer effort, running cost, portability/lock-in, quality, privacy/security, and maintenance. Record accepted decisions as ADRs.
- Frontend framework, UI system, routing, accessibility.
- Web/PWA first versus simultaneous native applications.
- Language/runtime, data validation, test tooling.
- Content format and build-time versus runtime delivery.
- Backend, authentication, database, backups, and data isolation.
- Media storage/audio delivery/asset rights.
- Workflow for 5–10 explanation/interface languages.
- Hosting, deployment, monitoring, rollback.
- Subscription/entitlement model and billing.
- Privacy, analytics, account deletion, and data export.

## Hypothesis to verify
A single deployable app with explicit modules is likely easier for a solo founder to maintain than microservices. Treat this as a hypothesis, not a final technology decision.

## Ready-for-implementation criteria
- Blocking architecture decisions are accepted or explicitly deferred with reasons.
- Data flow is documented for profile, content delivery, answer attempts, and progress.
- Content can be validated independently of UI code.
- A representative lesson can be loaded, rendered, exercised, and recorded end-to-end.
- Backup, privacy, deployment, and rollback are addressed before production learner data is collected.
