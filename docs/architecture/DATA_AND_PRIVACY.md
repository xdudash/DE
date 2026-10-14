# Learner Data, Sync, Security, and Privacy

Status: **Accepted** design (2026-10-12). Implementation: P2–P3. Provider: [ADR-0002](./decisions/ADR-0002-backend-auth-database.md). No production learner data may be collected before the P3 privacy gate in [quality gates](../quality/QUALITY_GATES.md) passes.

## Principles
Data minimisation, purpose limitation, EU residency, user-owned data (export/delete), server-side authorization, append-only learning evidence.

## Data model (initial; Postgres, all tables with RLS "owner only" unless stated)
| Table | Key columns | Notes |
|---|---|---|
| `profiles` | user_id (PK, = auth uid), display_name?, ui_lang, explanation_lang, region (de-DE/de-AT/de-CH/standard), goals[], weekly_minutes, created_at | No birth date, no nationality, no immigration status (never collected). |
| `learning_events` | id (uuid, client-generated), user_id, occurred_at, received_at, kind, content_id, local_id, content_version, concept_ids[], skill, result jsonb, evaluator_version | Append-only; insert-only policy; idempotent on id. |
| `concept_states` | user_id, concept_id, state, evidence_summary jsonb, updated_at | Derived; recomputable from events. |
| `review_items` | user_id, item_ref, due_at, interval_days, history jsonb | Scheduler state. |
| `saved_vocabulary` | user_id, sense_id?, lemma, context_sentence, source_ref, created_at | Context is copied only from content DeutschGo may display. |
| `entitlements` | user_id, tier, source, valid_until | Written only by server (billing webhooks); readable by owner. |
| `audit_log` | id, user_id?, action, at | Account-level actions (export, deletion) without learning content. |

## Authentication
Email magic link + Google + Apple sign-in (Apple required for iOS store apps later). Anonymous preview without account stores nothing server-side; after sign-up, an optional one-time import of the local session is offered.

## Sync model
Client keeps an offline queue of events (IndexedDB) → batched upload → server validates (schema, content id/version exists, re-evaluates closed exercises) → inserts → recomputes states. Conflicts cannot occur on events (append-only, unique ids); derived data is recomputed. Clock skew handled by storing both client and server timestamps.

## Security
- RLS on every table; service-role key only in server environment; no learner data accessible from static pages.
- Input validation at API boundaries (shared schemas); rate limiting on write endpoints.
- Secrets in Vercel/Supabase/GitHub secrets; never in the repo (public repository).
- Logs exclude tokens, request bodies with free text (writing/speaking), and email addresses.
- Writing texts and recordings: stored only when the feature needs it and the user opted in; never used for model training.

## Privacy operations (GDPR/DSG/nDSG)
- Lawful basis: contract (account/learning), consent (optional analytics beyond strictly necessary, AI feedback, recordings).
- Export: JSON of all user rows, self-service.
- Deletion: self-service; hard delete within 30 days including backups' retention window; documented.
- Retention: inactive accounts warned after 24 months, deleted after 36 (to confirm in privacy notice).
- Processors: Vercel, Supabase (EU region), monitoring, analytics, billing — listed in the privacy notice with DPAs.
- Children: product is for 16+ (age gate at sign-up, P2); no targeted features for minors.

## Backups
Supabase daily backups (plan-dependent) plus a weekly logical `pg_dump` to separate EU storage; quarterly restore test (see [operations](../quality/OPERATIONS.md)).
