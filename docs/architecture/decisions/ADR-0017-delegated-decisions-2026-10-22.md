# ADR-0017: Decisions taken under the owner's delegation (audit Q1, Q3, Q4, Q7)

- Status: Accepted
- Date: 2026-10-22
- Decision owner: Project owner, delegated. On 2026-10-22 the owner told the agent to do everything itself ("делай все сам"). The agent took the audit's recommended option where the choice is technical, reversible and costs no money, and records each one here so the owner can overturn any of them.

## Context
The project audit ([PROJECT_AUDIT_2026-10-22](../../development/PROJECT_AUDIT_2026-10-22.md), section 7) left ten owner questions open. Several of them block engineering work but do not need money, a legal entity or a human reviewer.

## Decision
| Question | Decision | Effect |
|---|---|---|
| **Q1** Where may sign-in, `DATABASE_URL` and push be configured before the privacy gate passes? | **Previews only.** Production keeps the "progress stays in this browser" behaviour until DG-030 (privacy notice, Impressum, processors, retention), DG-031 (monitoring) and DG-032 (backups with a restore test) pass. | Setup guides name Preview as the only environment for those variables. |
| **Q3** Do hearts apply in the first pass of a lesson? | **No. Hearts belong to practice.** The first run of a lesson is learning: wrong answers cost no heart and the lesson never pauses. A run of a lesson already finished on this device, or "Practise again", is practice: wrong answers cost a heart and checking pauses at zero. | ADR-0014 amended; DG-034 implements it. |
| **Q4** Goal taxonomy | **The spec set** — general, everyday, work, study, exam — with learner-friendly labels; the device set (life/work/study) is migrated, not dropped. | Unblocks DG-029. |
| **Q7** Rate-limit store | **A Postgres table** written with the service role; no new provider. | Unblocks DG-027. |

## Not decided here (need a person, money or a legal entity)
Q2 (paid Apple Developer account, email provider), Q5 (reviewers and budget), Q6 (monitoring and analytics providers), Q8 (paid database plan for daily backups), Q9 (product name, domain, legal entity), Q10 (rights confirmation). The agent prepares what it can for them but does not choose for the owner.

## Consequences
- Production stays without accounts for now; previews carry the full signed-in journey.
- Hearts can no longer block a learner who is learning something new.
- Any of the four decisions can be reversed by the owner with a superseding ADR; none of them created data or costs that would need undoing.
