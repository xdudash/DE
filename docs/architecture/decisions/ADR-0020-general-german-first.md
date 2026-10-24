# ADR-0020: General German first; no country or region choice
- Status: Accepted (owner decision, 2026-10-24)
- Date: 2026-10-24
- Decision owner: Project owner

## Context
The product named Germany, Austria and Switzerland, and the plan held a region choice (Germany, Austria, Switzerland). The owner decided that the course teaches general German first. Regional German is a later layer, not a choice made at the start. A German voice for Austria or Switzerland does not exist for free in the chosen audio tool (ADR-0019), and the choice added complexity to the plan and the content before it was needed.

## Decision
- The learner chooses goals and daily time only. No country or region is asked, stored or shown.
- The course plan has no regional topics. The regional concepts (Austrian and Swiss German, dialects, language varieties in DACH) are removed from `curriculum/inventory.json`. The course is regenerated from it.
- The product copy names no country. The tagline reads "German for life, work and study" in every interface language.
- Regional content (DG-059 and the regional notes in lessons) is deferred until the general course has reviewed units. Regional notes that already exist remain as `variety: standard`.
- Stored plans with a `region` field are read and the field is ignored (no data migration needed for the device).

## Consequences
- The database enum `dg_region` still lists `de-DE`, `de-AT`, `de-CH`. Nothing writes to it now; removing it needs a migration, which the owner applies. Left in place on purpose.
- The regional voice question in ADR-0019 no longer matters for the first course.
- The course has fewer distinct topics: the three regional topics are gone, and their lesson slots are taken by the general topics the generator assigns.

## Verification
- `apps/web` unit tests (plan, device-state, catalogs) pass with the region removed.
- `scripts/curriculum_plan.py --check` passes after regeneration; the chain check still holds.
