# ADR-0021: Batch drafting before the gold review (proposal)
- Status: Proposed (awaiting owner decision; not in force)
- Date: 2026-10-24
- Decision owner: Project owner

## Context
CLAUDE.md principle 5 and `.claude/rules/content-data.md` say: no bulk content before the gold unit is human-reviewed, and afterwards batches no larger than review capacity. The owner asked for the whole course to be drafted now, to be reviewed later. Drafting 5000 lessons before any review would produce content nobody can check, and fixing it later costs more than writing it in parts. This ADR does not change the approval rule, which stays as it is.

## Proposal
1. Drafting may start before the gold unit is reviewed, but only in batches of at most 10 lessons per pull request.
2. Every drafted lesson is `status: needs_review` (or the equivalent draft status). None is set to `approved` or `published`.
3. The learner UI keeps the draft and unreviewed banners (CLAUDE.md, web-app rules) until a recorded human review exists.
4. Each batch is reviewed as its own pull request before the next batch is opened. The owner names the reviewer in the `review` block; the agent never names one.
5. A lesson is approved only after a recorded human review. Drafting never counts as review.

## Consequences
- The course can grow in reviewable steps without a human waiting for the whole course.
- Work done under this proposal may need rewriting after review. The batch size keeps that cost small.
- If the owner does not accept this, principle 5 stays as it is and content is written only after the gold unit review.

## Action on acceptance
When the owner accepts this ADR, the same pull request or a follow-up changes CLAUDE.md principle 5 and `.claude/rules/content-data.md` to match, and the status here changes to Accepted.
