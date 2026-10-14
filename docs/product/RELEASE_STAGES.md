# Release Stages

Status: **Accepted** (2026-10-12). Replaces the former "MVP scope" document.

DeutschGo is designed as a complete product ([functional specification](./PRODUCT_SPEC.md)). Releases expose that design **progressively to real learners**; they never redefine the product as smaller. A capability enters a release only when it works end-to-end with real data; anything else is hidden or labelled.

## R0 — Internal preview (end of P1)
Who: owner and reviewers. Purpose: calibrate content quality and the contract.
- Gold-standard unit rendered from the compiled bundle in en/ru/uk with interactive exercises.
- No accounts; nothing persisted; draft/review banners visible.
- Exit: gold unit passes human linguistic + pedagogical review; contract adjustments merged (contract v1.x).

## R1 — Closed pilot (end of P3)
Who: 20–50 invited learners (uk/ru first).
- Accounts, persisted attempts, evidence events, concept states, explainable next step.
- A reviewed A1 sentence-structure route (≈10–15 units) + review scheduler.
- Knowledge map and search for the authored slice; planned concepts visible as "planned".
- Exit criteria: core journey completes without broken steps for ≥90 % of pilot sessions; zero data-loss incidents; content error reports triaged within a week.

## R2 — Public beta, free (end of P5)
- A1 complete, A2 in progress, reading pilot and learner dictionary, listening with real audio, first writing/speaking activities with honest labels.
- Wave-1 languages (uk, ru, en) fully reviewed for released units.
- Privacy: export/deletion live; monitoring, backups with tested restore.

## R3 — Subscription launch (end of P7)
- Free and premium entitlements ([monetization](./MONETIZATION.md)); billing provider live (ADR-0008 accepted).
- A1–B1 coverage published; wave-2 languages enabled where coverage policy is met.

## R4+ — Continuous expansion (P8)
B2–C1 depth, more scenarios and professions, native app store presence (Capacitor), more languages, human-review offerings.

## Release gate (applies to every release)
1. The defined learner journeys complete end-to-end with real data ([quality gates](../quality/QUALITY_GATES.md)).
2. All shipped content is human-reviewed (linguistic, pedagogical, rights) in the languages it is offered in.
3. Every exercise has a verifiable answer model or documented rubric; validator passes.
4. Unsupported or unfinished capabilities are hidden or labelled.
5. Privacy, backup/restore, monitoring, and rollback are in place before learner data is collected.
