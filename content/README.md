# Learning Content

Authored, version-controlled content following the [content contract](../docs/domain/CONTENT_CONTRACT.md). Never learner data.

```text
languages.yaml            explanation/interface language registry
sources.yaml              source registry (only "approved" sources may be referenced)
concepts/<domain>/        canonical language concepts (German-facing; "planned" = graph placeholder)
units/<domain>/           learning units (blocks + exercises)
routes/                   recommended sequences
i18n/<lang>/              explanation strings per entity (status, based_on_version)
```

Validate after every change: `npm run content:validate`. Gold-standard calibration unit: `units/syntax/unit.syntax.v2_declarative.a1.yaml`. Future families (lexicon, resources, scenarios, diagnostics) get their own folders when their schemas are accepted. Large media never goes into Git (ADR-0007).
