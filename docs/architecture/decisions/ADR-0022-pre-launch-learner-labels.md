# ADR-0022: Pre-launch exception for review labels in the learner interface
- Status: Accepted (owner decision, 2026-10-24)
- Date: 2026-10-24
- Decision owner: Project owner

## Context
Principle 3 (CLAUDE.md) and the web-app rules require draft, unreviewed and machine-translated labels to stay in the learner interface until the condition is gone. The owner decided that, before launch, these labels are not shown to learners. The product has no learner accounts and no public launch yet.

## Decision
- Before launch, the learner interface does not show "draft", "not reviewed" or "machine-translated" labels or banners (lesson page, lesson flow, knowledge map).
- Fallback notices (text shown in English because a translation is missing) and unsaved-progress notices stay. They describe what the learner sees, not review status.
- Data statuses do not change: content stays `needs_review`, translations stay `draft` or `machine_draft`, and nothing is marked `approved` or `published` without a recorded human review (CLAUDE.md principle 4).

## Consequences
- Before the first public launch, this exception must be ended or re-decided by a new ADR. The launch checklist must include it.
- The data and the content validator still show the true status. The learner interface does not.
- Pages no longer show the review state to anyone. This is a known limitation until launch.
