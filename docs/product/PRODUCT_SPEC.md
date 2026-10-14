# Functional Specification (complete product)

Status: **Accepted** as the target design (2026-10-12). Delivery order: [roadmap](../development/ROADMAP.md). Phase codes refer to roadmap phases (P0–P8).

## 1. Functional area map

```text
                    ┌──────────────────────── Learner-facing ────────────────────────┐
  F1 Onboarding &   F2 Navigation:    F3 Lesson     F4 Practice &   F5 Review     F6 Library:
  goals, diagnostic map, search,      player        evaluation      (spaced       reading, listening,
        │           routes                │              │          repetition)   dictionary/vocab
        │              │                  │              │              │              │
        └──────────────┴──────► F7 Learning engine (states, mastery, recommendations) ◄┘
                                          │                         ▲
  F8 Skills: writing, speaking, pronunciation ─────────────────────┘
                                          │
  ┌──────────── Platform ─────────────────┼─────────────────────────────────────────┐
  F9 Accounts, sync,  F10 Localization &  F11 Entitlements  F12 Analytics &   F13 Admin/ops
  privacy, export     regional variants   & billing         experimentation    (feature flags,
                                                                                 support, status)
  ┌──────────── Content system (offline, in Git) ─────────────────────────────────────┐
  F14 Knowledge graph · units · routes · exercises · lexicon · resources · l10n · sources
      authored in YAML → validated → reviewed → compiled to bundles (ADR-0003)
```

Rules: F1–F8 only read content through the compiled bundle and the content-kit API; they never embed teaching text in code. Learner state (F7/F9) never lives in the content repository.

## 2. Requirements by area

### F1 Onboarding, goals, diagnostic (P2, P4)
- Choose explanation language, goal(s) (general, everyday, work, study, exam), DACH context (DE/AT/CH/general), weekly time budget.
- Starting point: self-report, short adaptive placement (estimate with confidence band, never "official CEFR"), or "start from zero".
- Learner can edit the inferred starting point at any time; diagnostic version is stored with the result.

### F2 Navigation: knowledge map, search, routes (P2–P3)
- Browse the concept graph by strand, level, and goal; open any concept or unit.
- Search over titles/summaries in the explanation language and over German forms (lemmas, inflected forms).
- Prerequisite guidance: show missing/weak prerequisites, offer a catch-up path; never block.
- Routes are recommendations: learner can reorder, skip, or follow multiple routes; exploration never erases the active route.

### F3 Lesson player (P1 ✔ skeleton, P2)
- Renders all unit block types from the [content contract](../domain/CONTENT_CONTRACT.md): explanation, pattern table, examples (highlighted forms), contrasts, common errors, regional notes, summary, exercises.
- Shows review/translation status honestly (draft, machine draft, fallback to pivot language).
- Works with keyboard and screen readers; mobile-first; usable on slow connections.

### F4 Practice and evaluation (P1 ✔ evaluator, P2–P5)
- Exercise types v1: single choice, word order, cloze, transform (implemented in `content-kit`).
- Planned types: matching, categorisation, error correction, dictation (audio), listening comprehension, guided writing with rubric, speaking prompts, minimal pairs.
- Every exercise: objective link, accepted variants, targeted error feedback, explanation; evaluation is deterministic for closed types.
- Errors may signal concepts → diagnostic evidence for F7.

### F5 Review / spaced repetition (P3)
- Review items: concepts (via exercise variants), vocabulary senses, collocations, phrases.
- Scheduler v1 transparent and tested; FSRS-class scheduler once history exists ([learning engine](../domain/LEARNING_ENGINE.md)).
- Learner controls daily load; "again" vs success semantics defined per content type.

### F6 Library (P4–P5)
- Graded reading texts and dialogues (original or rights-cleared), each linked to concepts and vocabulary, level-tagged, region-tagged.
- Listening: real recordings (and labelled synthetic speech where permitted), transcripts, speed control, comprehension tasks.
- Learner dictionary: lemma → senses → forms, gender/plural/case government, collocations, examples; tap-to-look-up in texts; save word *in context*.
- External resources: curated links (DW, Goethe, public broadcasters) with descriptions — link-only unless reuse is licensed.

### F7 Learning engine (P2–P6)
- Evidence events (exposure, attempt, result, recall, transfer) stored per learner, concept, skill.
- Concept states: unseen, available, in_progress, needs_practice, review_due, provisionally_mastered.
- Explainable recommendations with human-readable reasons and override.
- Analytics on own learning: per-concept and per-skill progress with the evidence behind it.

### F8 Productive skills (P5)
- Writing: tasks with purpose, audience, register, rubric; automatic checks (form, required elements) + optional AI feedback clearly labelled as heuristic; later human review marketplace (not before P8).
- Speaking: shadowing, prepared answers, role-play prompts; record & compare; ASR-based checks only where validated; no "pronunciation score" without a validated method ([skills](../domain/SKILLS.md)).

### F9 Accounts, sync, privacy, export (P2–P3)
- Use without account for preview content; account (email magic link + OAuth Google/Apple) for persistence and sync across devices.
- Offline-tolerant attempts queue; idempotent sync; conflict rule: append-only evidence events, derived states recomputed.
- GDPR: data export (JSON), account deletion (hard delete within 30 days), retention limits, EU data residency ([data & privacy](../architecture/DATA_AND_PRIVACY.md)).

### F10 Localization and regional variants (P1 ✔ model, P2–P6)
- UI strings and explanation content localised separately; RTL support (Arabic, Persian) from the start.
- Per-language availability computed from coverage and review status ([localization policy](../domain/LOCALIZATION_POLICY.md)).
- Learner region preference affects examples/notes shown, never the canonical facts.

### F11 Entitlements and billing (P7)
- Free and premium entitlements enforced server-side; content marks premium availability in route/unit metadata, not in code.
- Billing provider per [ADR-0008](../architecture/decisions/ADR-0008-billing.md) (proposed); app-store purchases only when native apps ship.

### F12 Product analytics and experimentation (P2 baseline, P6)
- Privacy-preserving, cookieless product analytics (EU-hosted) for funnels and feature use; learning analytics from evidence events.
- No third-party ad trackers. Experiments only with pre-registered success metrics.

### F13 Operations and admin (P2–P7)
- Error monitoring, uptime, backups with tested restore, release notes, feature flags, status page ([operations](../quality/OPERATIONS.md)).
- Content dashboard: coverage per level/strand/language, review queues, stale translations (generated from validator output).

### F14 Content system (P1 ✔ v1, continuous)
- Authoring in Git, validation in CI, separate human review gates, compiled bundles ([content contract](../domain/CONTENT_CONTRACT.md), [content review](../quality/CONTENT_REVIEW.md)).

## 3. Feature table (status as of 2026-10-12)

| Area | Capability | Phase | Status |
|---|---|---|---|
| F14 | Content contract v1 (schemas, validator, evaluator, compiler) | P1 | Implemented, CI-verified on PR |
| F14 | Gold-standard unit V2 (en pivot, ru/uk drafts) | P1 | Authored, **not human-reviewed** |
| F3/F4 | Lesson player + 4 exercise types (no persistence) | P1 | Implemented skeleton |
| F10 | Language registry, per-entity l10n, coverage report | P1 | Implemented |
| F9 | Accounts, persistence, sync | P2–P3 | Planned |
| F7 | Evidence events, states, recommendations | P2–P3 | Planned |
| F2 | Knowledge map UI, search | P2–P3 | Minimal list only |
| F5 | Review scheduler | P3 | Planned |
| F6 | Reading pilot, dictionary, audio | P4–P5 | Planned |
| F8 | Writing/speaking | P5 | Planned |
| F11 | Freemium + billing | P7 | Planned |
| F12/F13 | Analytics, monitoring, backups | P2+ | Planned |
