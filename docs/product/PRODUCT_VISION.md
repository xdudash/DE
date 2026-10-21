# Product Vision

Status: **Accepted** (2026-10-12, PR "foundation: architecture, content contract, gold unit"). Changes require an update of this file in a reviewed PR.

## Definition
DeutschGo is a structured, deep German-learning system for life, work, and study in Germany, Austria, and Switzerland (DACH). It combines a connected **model of German** (concepts, rules, forms, word senses, collocations, pragmatics, regional variation) with a **curriculum** from absolute beginner to advanced (A1 → C1, extensible to C2), practice in **all four skills**, and **transparent progress** that reflects demonstrated ability rather than time spent.

It is built and operated by one founder with Claude Code. Every design choice must therefore be maintainable without a team.

## Positioning
"A map of German with a guide." Learners see what German is made of, where they are on the map, what they need next and why — and can go anywhere on the map at any time.

| Typical app | DeutschGo |
|---|---|
| Fixed lesson chain, locked levels | Free navigation over a knowledge graph; prerequisites shown, never hidden walls |
| Short rules of thumb | Precise rules with scope, limits, contrasts, exceptions, and learner-specific errors |
| Right/wrong only | Explanatory feedback tied to the specific mistake and the concept it signals |
| Streaks and XP as "progress" *(revised by [ADR-0014](../architecture/decisions/ADR-0014-motivation-xp-streaks-hearts.md): XP, levels, streaks and hearts are now part of the MVP, with guardrails)* | Evidence-based states: exposure, practice, performance, delayed recall, transfer |
| One-size explanations, often English-only | Explanations in the learner's language, written for their transfer errors |
| Germany-only or regionally blind | Standard German plus labelled Austrian/Swiss/regional usage and DACH life contexts |
| Text-only "listening"/"speaking" | Real audio, real recordings; assessment claims limited to what is actually measured |

## Audiences
Primary (launch): adults and young adults moving to or living in DACH who need German for **integration, work, and everyday administration**, explained in **Ukrainian, Russian, or English**.

Secondary (later waves): Turkish-, Arabic-, Polish-, Romanian-, Persian-, and Spanish-speaking learners; skilled workers and students preparing for jobs, recognition procedures, university, or exams (telc/Goethe/ÖSD/TestDaF — preparation only, never official certification).

### Personas (design references)
- **Olena (uk, A0→B1, Vienna):** temporary protection, needs Behörden, AMS, school letters; studies 20 min/day on a phone; wants to understand *why*.
- **Dmitri (ru, A2, Munich, IT):** works in English, wants grammar gaps closed and B2 for permanent residence; jumps between topics.
- **Aylin (en/tr, B1, Zürich, nurse):** profession-specific vocabulary, Swiss usage, listening to fast speech, writing reports.

## Core use cases
1. Start from zero or estimate a starting point; get an explainable, editable route for a goal.
2. Open any topic (search, map, route), see level, objectives, prerequisites, and related topics; study and practise it.
3. Get specific, reasoned feedback; have mistakes feed diagnosis and review.
4. Read and listen to level-appropriate, rights-cleared texts and audio; collect words in context (with sense and grammar), review them.
5. Practise writing and speaking with honest feedback modes (automatic checks, AI-assisted heuristics, optional human review later).
6. Prepare for real situations (appointments, calls, forms, workplace) with region-aware material.
7. See progress per concept and skill with the evidence behind it; export or delete all personal data.

## Product pillars
1. **Connected knowledge of German** — one canonical concept base reused by all units, routes, and exercises ([knowledge model](../domain/KNOWLEDGE_MODEL.md)).
2. **Pedagogically sound depth** — explanation standard, gold-standard calibration, separate human review ([content standard](../domain/CONTENT_STANDARD.md)).
3. **Freedom with guidance** — explainable recommendations, never hard locks ([learning engine](../domain/LEARNING_ENGINE.md)).
4. **Four skills + language knowledge** — each skill has its own activities and honest evaluation ([skills](../domain/SKILLS.md)).
5. **Multilingual explanations from day one** — architecture for 5–10 languages; per-language availability and review state are explicit ([localization policy](../domain/LOCALIZATION_POLICY.md)).
6. **DACH-aware** — standard German first, regional usage labelled ([regional varieties](../domain/REGIONAL_VARIETIES.md)).
7. **Responsibly sourced** — original content plus lawfully reusable data; links instead of copies when rights are unclear ([source register](../sources/SOURCE_REGISTER.md)).
8. **Sustainable** — free core learning plus a subscription for depth and volume ([monetization](./MONETIZATION.md)).

## Principles
- Understanding over gamification. No loss-pressure copy, no fake progress. *(Revised by ADR-0014: streaks, XP and hearts exist, but hearts never lock explanations and no message frames a missed day as a loss.)*
- Reuse over duplication: a fact about German lives in exactly one place.
- Honesty in UI: draft, unreviewed, machine-translated, unpersisted, or unavailable states are visible.
- Privacy by default; minimal data; export and deletion are product features.
- Accessible (WCAG 2.2 AA target), mobile-first, works on low-end phones and slow networks.
- Phased delivery of a complete design: phases order the work; they do not shrink the product.
- Maintainable by one person: few moving parts, strong automated checks, documented decisions.

## Long-term scope (the complete product)
See the [functional specification](./PRODUCT_SPEC.md) for all functional areas and the [roadmap](../development/ROADMAP.md) for their order. Completeness is a multi-year objective: no claim is made that "all of German" is covered; coverage is measured and published per level and strand ([curriculum framework](../domain/CURRICULUM_FRAMEWORK.md)).

## Non-goals
Not a flashcard app, a fixed chain of shallow lessons, an unrestricted AI chat wrapper, a scraper of copyrighted courseware, an official certification body, or a streak system that confuses activity with competence.
