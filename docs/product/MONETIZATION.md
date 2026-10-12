# Monetization and Access Model

Status: **Accepted as principles**; prices and exact limits are **hypotheses** to be validated in R1/R2 before R3. Billing provider: [ADR-0008](../architecture/decisions/ADR-0008-billing.md) (proposed).

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
