# Roadmap

Status: **Accepted** (2026-10-12); **revised 2026-10-22** after the [project audit](./PROJECT_AUDIT_2026-10-22.md) (P2/P3 exit criteria made checkable, stages A–I mapped to phases). Phases order the delivery of the complete product ([functional specification](../product/PRODUCT_SPEC.md)); they do not shrink it. Learner-facing release stages: [release stages](../product/RELEASE_STAGES.md). Task register: [backlog](./BACKLOG.md).

```text
P0 Foundation ✔ ─► P1 Contract & skeleton ✔(review pending) ─► P2 Accounts & learning loop ─► P3 Core A1 route & review ─► R1 pilot
                                                     │                                              │
                                                     └──► content track: A1 graph → units (review-paced, continuous) ─┘
P3 ─► P4 Lexicon, reading, diagnostics ─► P5 Listening, writing, speaking, scenarios ─► R2 public beta
P5 ─► P6 Adaptivity, analytics, wave-2 languages ─► P7 Freemium & billing ─► R3 ─► P8 Scale (B2–C1, native apps, more languages)
```

| Phase | Goal | Key deliverables | Exit criteria | Depends on |
|---|---|---|---|---|
| **P0 Foundation** ✔ | Agree product, decisions, process | Vision, spec, ADRs, workflow, CI | Docs merged | — |
| **P1 Contract & skeleton** | Prove the content model end-to-end | Content contract v1, validator, evaluator, gold unit, web skeleton (✔ in PR); human review of gold unit (DG-007); lockfile (DG-011, in review) | Gold unit human-reviewed; contract v1.x adjusted; CI green | P0 |
| **P2 Accounts & learning loop** | Real persistence and explainable next step | ✔ schema + RLS (DG-008), attempts (DG-009), engine (DG-010), UI catalogs (DG-014), E2E + axe (DG-013), PWA (DG-016), sign-in code (DG-015), motivation (DG-020). **Remaining (stages A–B):** lockfile (DG-011, in review), recall events (DG-021), token hardening + refresh (DG-026, DG-025), one event identity + retry (DG-022), server read path + device import (DG-024), profile alignment (DG-029), rate limits (DG-027), monitoring (DG-031), signed-in E2E (DG-037) | One learner completes setup → unit → persisted attempt → state → next step **and sees the same state in a second browser**, proven by DG-037 in CI; a recall advances the schedule (DG-021) | P1 |
| **Content track (continuous from P1)** | Build A1 knowledge graph and units at review pace | ✔ A1 planned graph (DG-012); gold review (DG-007); contract v1.x (DG-041); batches of ≤5 (DG-042, DG-043); review records + dashboard (DG-044); exercise types v2 (DG-045) | Each batch passes content review | P1 gold approval |
| **P3 Core A1 & review** | First complete route + spaced repetition | ≈10–15 reviewed units; offline queue + sync (DG-023); review session (DG-048); prerequisite guidance (DG-046); route choice (DG-047); recommendation reasons (DG-049); export + audit log (DG-028); privacy gate pack (DG-030); backups + restore test (DG-032); analytics baseline (DG-033) | **R1 closed pilot** gates pass, including the privacy gate in [quality gates](../quality/QUALITY_GATES.md) | P2 |
| **P4 Lexicon, reading, diagnostics** | Words in context and placement | Lexicon schema (lemma/sense/forms); licensed frequency data; reading pilot (original texts); tap-to-lookup; saved vocabulary review; placement test v1 | Saved senses reviewable; placement shows uncertainty; sources approved | P3 |
| **P5 Skills & scenarios** | Four skills with honest evaluation | ADR-0007 decided; recorded audio pipeline; listening tasks; writing tasks with rubric (+ labelled AI feedback); speaking practice (shadowing/role-play); DACH scenarios (Behörden, Wohnen, Arbeit) | Each claimed skill has a real activity; **R2 public beta** gates pass | P4 |
| **P6 Adaptivity & languages** | Better guidance, more audiences | FSRS-class scheduler A/B; learning analytics; content dashboard; wave-2 languages (tr, ar, pl, ro) where coverage policy is met | Measured recall improvement or rollback; language coverage disclosed | P5 |
| **P7 Freemium & billing** | Sustainable business | ADR-0008 accepted; entitlements; paywall per [monetization](../product/MONETIZATION.md); legal pages | **R3 subscription launch** | P6 (+ legal/tax readiness) |
| **P8 Scale** | Depth and reach | A2–C1 completion, professions/exam tracks, Capacitor apps, wave-3 languages, optional human review services | Continuous | P7 |

## Decisions to make before their phase (not blocking current work)
| Decision | Needed by | Owner action |
|---|---|---|
| Qualified reviewers for German, uk, ru (paid/volunteer) | DG-007 (now) | Find 1 German reviewer + uk/ru reviewers |
| Supabase/Vercel accounts and paid plans | P2 provisioning / before R1 | Authorize creation, add secrets |
| Product name/domain/legal entity, privacy notice | before R1 | Owner |
| Audio recording partners/budget (ADR-0007) | P5 | Owner |
| Prices and limits (MONETIZATION) | P7 | Owner, from pilot data |
| Where sign-in and the database may be switched on before the privacy gate (audit Q1) | now | Owner |
| Email sign-in; Apple account (Q2), hearts scope (Q3), goal taxonomy (Q4) | P2 | Owner |
| Monitoring/analytics providers (Q6), rate-limit store (Q7), backup plan (Q8) | P2–P3 | Owner |

## Risks
| Risk | Impact | Mitigation |
|---|---|---|
| Human review capacity is the bottleneck | Content growth stalls or quality drops | Review-paced batches; AI pre-review; reviewer checklist; prioritise A1 core |
| AI-authored German errors slip through | Trust damage | Hard validator gate on approved status; learner error reports; reviewer per batch |
| Scope breadth vs one founder | Burnout, half-finished areas | Phased plan; each phase ships a complete journey; no parallel big areas |
| Rights issues with sources | Legal risk, takedown | Original content first; source registry with approval; link-only by default |
| Provider cost/pricing changes | Budget | Portability paths in ADR-0002/0005; cost triggers in operations |
| Learner data incident | Legal/trust | Privacy gate before R1; RLS tests; minimal data |
| Learner data collected in production before the privacy gate (configuration alone switches it on) | GDPR exposure | Owner rule Q1; DG-030 before production sign-in |
| Device and server progress diverge; features keep building on device-only numbers | Rework of every progress screen | Close the loop first (DG-022, DG-024) before new device-only features |
| Review scheduler never advances because no recall events exist | Core learning promise fails silently | DG-021 with fixtures and E2E |
| Unpinned dependencies change behaviour between builds | Flaky CI, surprise breakage | DG-011 |
