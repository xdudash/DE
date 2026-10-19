# Monetization and Access Model

Status: **Decision (2026-10-19): the product is free during build-out.** Principles below stay binding for the later change. Prices and limits remain **hypotheses** to be validated in R1/R2 before R3. Billing provider: [ADR-0008](../architecture/decisions/ADR-0008-billing.md) (proposed).

## Current decision: free during build-out (2026-10-19)
- **Everything is free now**: all units, practice, review, and features that exist or are built before R3. No paywall, no entitlement checks, no billing code, no tier gates in the app today.
- **Monetization is added later, as one change.** It is a single planned PR that implements the tier table below, the chosen billing provider (ADR-0008), entitlement enforcement on the server, pricing pages, and the legal and privacy updates. It is scheduled in P7 and gated by R3.
- **Seams are kept so the change stays small**: the `entitlements` table exists in the schema (no writes yet), access is enforced server-side (principle 4), and content does not yet carry access tiers. When the paid change lands, tier metadata is added to content and checked only on the server.
- **Free stays free for understanding** (principle 1). Paid tiers would only add depth, volume, and personalisation, never the explanations a free learner needs.
- **Learners must be told before any charge.** Accounts, pricing, and consent notices must be in place before the first payment. Nothing in the current app implies a future price.

## Principles
1. **Never paywall understanding.** Every concept explanation needed to understand German, and every prerequisite of a free unit, stays free. A paywall must never break the logic of the knowledge graph.
2. **Charge for depth, volume, and personalisation** — things that cost money to produce or run (audio, AI-assisted feedback, large practice banks, analytics).
3. **No dark patterns**: no fake scarcity, no streak-loss pressure, cancellation as easy as sign-up, clear regional pricing.
4. **Entitlements are data, enforced server-side**; content declares access tier in metadata, not in UI code.

## Tiers (hypothesis)

| Capability | Free | Premium |
|---|---|---|
| Knowledge map, all concept explanations (all levels) | ✔ | ✔ |
| Units | A1 complete; sample units at A2+ | All levels |
| Practice per unit | Core set | Extended banks, adaptive variants |
| Review (spaced repetition) | Daily cap | Unlimited, custom decks |
| Reading/listening library | Starter set | Full library, speed control, offline |
| Writing/speaking feedback | Automatic checks | + AI-assisted feedback (labelled) |
| Progress | Concept states | Detailed analytics, exports, goal plans |
| Explanation languages | All available | All available |

Price hypothesis: €7–9 / month, €59–69 / year; purchasing-power-adjusted regional prices; a reduced/free tier for documented hardship partners (NGOs, integration courses) to be evaluated.

## Validation plan
- R1/R2: measure what learners use, where they stop, willingness to pay (survey + fake-door only if honestly labelled "coming soon").
- Decide final limits in a reviewed update of this document before implementing F11.
