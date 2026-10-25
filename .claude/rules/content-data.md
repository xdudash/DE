---
description: Rules for authored German-learning content and structured data
---
# Content and learning-data rules

- Read the knowledge model and content standard before authoring or changing learning data.
- Use the committed schema family (docs/domain/CONTENT_CONTRACT.md, packages/content-kit/schemas). Never invent a parallel format; schema changes follow CONTENT_CONTRACT §8.
- Keep stable IDs independent of display titles and explanation language.
- Link content to concept IDs and prerequisites instead of duplicating definitions.
- Include answer keys or explicit evaluation rubrics and learner-facing feedback.
- Run `npm run content:validate` after every content change (skill: validate-content).
- Preserve source, version, license/terms, attribution, and provenance for external material.
- Treat AI-generated translations as drafts that require review.
- Never mark linguistically or pedagogically unreviewed content as approved.
- Batch drafting (50–100 lessons per PR, all `needs_review`) follows ADR-0021; the owner samples each level.
