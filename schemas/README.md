# Schemas

Versioned schemas will define contracts for lessons, concepts, exercises, routes, localizations, and source/license metadata.

## Rules
- Agree the domain contract before authoring a schema.
- Select a schema standard/version and document compatibility expectations.
- Prefer strict validation for required fields and identifiers, with deliberate extensibility.
- Each schema change must include valid and invalid examples/tests, migration notes if content exists, and validator updates.
- Schema-valid means structurally valid, not linguistically correct or pedagogically approved.

The first schema task should produce a reviewed lesson contract and validate one gold-standard lesson before bulk lesson creation.
