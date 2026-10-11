# German Knowledge Model

## Purpose
Represent German-language knowledge independently of lesson order or UI navigation.

## Core entities

### Language concept
A stable unit of knowledge: word order, dative-case functions, separable-prefix verbs, a lexical sense, collocation, pronunciation, register, pragmatics, or a regional usage note. Each concept should have:
- Stable ID and type.
- Canonical description of the German phenomenon.
- Scope, variety, and register (standard, regional, colloquial, formal, etc.).
- Forms/rules and contextual examples.
- Relevant learner confusions and limitations/exceptions.
- Typed relationships to other concepts.
- Suggested CEFR range with rationale.
- Sources/editorial evidence where applicable.
- Version and status: draft, needs_review, approved, deprecated.

### Learning unit
A pedagogical treatment of one or more concepts for a learner goal and level. It contains selected explanations, examples, scaffolding, practice, and assessment. Multiple units may reuse the same concept for different levels or goals.

### Curriculum node or route
A collection/sequencing of learning units with an intended audience and rationale. A route does not own or duplicate canonical concept definitions.

### Exercise
A task with objective, prompt, response type, answer model or rubric, feedback, and concept links.

### Resource/asset
A text, dialogue, recording, image, or external reference with provenance, version, rights metadata, and attribution requirements.

### Learner evidence
Attempts, outcomes, confidence, review history, and mastery estimates, stored separately from authored content.

### Localization
An explanation or UI string in a supported language, linked to canonical concept/content IDs. Missing translation must be distinguishable from intentionally unavailable content.

## Typed relationships
Possible relationships include prerequisite_for, depends_on, related_to, contrasts_with, demonstrates, commonly_confused_with, belongs_to_domain, and attested_in. Document one canonical direction per edge type. Validate referenced IDs and detect prerequisite cycles; other relationship types may be cyclic.

## IDs and versioning
- IDs are stable and independent of titles and languages.
- Renames must not break references.
- Deprecate or redirect removed concepts if learner history may reference them.
- Schema changes require compatibility notes and migrations where needed.
- Keep content human-reviewable and diff-friendly in version control.

## Orthogonal axes
Track proficiency/CEFR level separately from topic domain and demonstrated skill. A concept may appear in multiple levels with different depth.

## Decisions still required
Exact JSON schema, composing facts/examples/translations, answer variants and partial credit, media licensing model, and review statuses. These are explicit design tasks; do not invent incompatible formats independently.
