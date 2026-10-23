# Learner Data, Sync, Security, and Privacy

Status: **Accepted** design (2026-10-12). Schema and policies implemented in [`supabase/migrations`](../../supabase/migrations/) and verified by [`supabase/tests`](../../supabase/tests/) (DG-008); the hosted EU project `deutschgo` exists (2026-10-20), learner storage is switched on only by configuration ([accounts setup](../development/ACCOUNTS_SETUP.md)). Provider: [ADR-0002](./decisions/ADR-0002-backend-auth-database.md). No production learner data may be collected before the P3 privacy gate in [quality gates](../quality/QUALITY_GATES.md) passes.

## Principles
Data minimisation, purpose limitation, EU residency, user-owned data (export/delete), server-side authorization, append-only learning evidence.

## Data model (initial; Postgres, all tables with RLS "owner only" unless stated)
| Table | Key columns | Notes |
|---|---|---|
| `profiles` | user_id (PK, = auth uid), display_name?, ui_lang, explanation_lang, region, goals[], weekly_minutes, age_confirmed, created_at, updated_at | No birth date, no nationality, no immigration status (never collected); the 16+ age gate is a boolean assertion. |
| `learning_events` | id (uuid, client-generated), user_id, occurred_at, received_at, kind, content_id, local_id, content_version, concept_ids[], signals[], skill, correct, score, evaluator_version | Append-only: insert+select policies only, and UPDATE/DELETE revoked from the API role. Idempotent on id. Constraints: graded kinds carry a result, non-graded kinds must not; `signals` only on wrong answers. |
| `concept_states` | user_id, concept_id, state, because, evidence jsonb, engine_version, updated_at | Derived; recomputable from events. Learner-readable, server-written. |
| `review_items` | user_id, item_ref, step, interval_days, anchor_at, due_at, updated_at | Scheduler state; mirrors `packages/learning-engine`. |
| `saved_vocabulary` | id, user_id, lemma, sense_id?, context_sentence, source_ref, explanation_lang, created_at | Context is copied only from content DeutschGo may display. |
| `entitlements` | user_id, tier, source, valid_until | Written only by server (billing webhooks); readable by owner. |
| `audit_log` | id, user_id?, action, at | Account-level actions (export, deletion) without learning content. |

## Attempt recording (implemented, DG-009)
`POST /api/attempts` takes an attempt without a verdict, verifies the session token (the project's ES256/RS256 signing keys from its JWKS, or a legacy HS256 secret; `exp`, audience and role required; `lib/auth/jwt.ts`, `lib/auth/keys.ts`), re-evaluates the answer server-side with the same evaluator the content validator uses, inserts the event as the learner (RLS checks `user_id`; a replayed id is ignored, so an offline queue is safe), then recomputes the touched concepts from stored evidence and refreshes the derived caches as the service role. Statuses: 201 created · 200 replay · 400 malformed · 401 no/invalid session · 404 unknown content · 409 content version moved on · 422 response does not fit the exercise · 503 deployment without auth or database. A client clock ahead of the server is clamped to the server time.

## Authentication
Email magic link + Google + Apple sign-in (Apple required for iOS store apps later). Anonymous preview without account stores nothing server-side; after sign-up, an optional one-time import of the local session is offered.

## Sync model
Implemented so far (DG-022): each answer has one client-generated id shared by the device record and the account copy; a write-ahead outbox in `localStorage` keeps submissions until the server gives a final answer and retries transient failures. Target design: client keeps an offline queue of events (IndexedDB, DG-023) → batched upload → server validates (schema, content id/version exists, re-evaluates closed exercises) → inserts → recomputes states. Conflicts cannot occur on events (append-only, unique ids); derived data is recomputed. Clock skew handled by storing both client and server timestamps.

## Security
- RLS on every table, every policy scoped with `auth.uid()`; service-role key only in the server environment; no learner data accessible from static pages.
- Defence in depth: besides the missing policies, UPDATE/DELETE are revoked from `authenticated` on `learning_events`, all writes are revoked on the server-maintained tables, and `anon` holds no privileges in `public`. A structural test asserts the whole policy inventory, so loosening one layer fails CI.
- GDPR export runs through `export_my_data()` as `security invoker`, so RLS applies to it too; account deletion cascades from `auth.users` to every learner table (tested).
- Input validation at API boundaries (shared schemas); rate limiting on write endpoints (DG-027: fixed windows in `rate_limits`; subjects are SHA-256 hashes of a learner id or client address; counters are deleted after their window plus one minute).
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
