# Incidents

How DeutschGo handles something going wrong in production, and the record of what went wrong. Policy source: [operations](../quality/OPERATIONS.md#incident-handling); data rules: [data & privacy](../architecture/DATA_AND_PRIVACY.md). Production changes, migrations and learner-data deletion still need the owner's explicit authorization, also during an incident.

## Severity
| Level | Meaning | Examples | First response |
|---|---|---|---|
| **S1** | Learner data exposed, lost or altered; or the app is unusable for everyone | an RLS gap, a leaked secret, deleted events, production down | Stop the harm (roll back the deployment, revoke the secret), tell the owner at once, start the GDPR clock |
| **S2** | A core journey is broken for many learners, no data harm | lessons do not load, answers are not saved, sign-in fails | Roll back or fix forward the same day |
| **S3** | A defect with a workaround, or wrong content | a wrong German example, a broken link, a misleading label | Fix in the next change; content errors go through [content review](../quality/CONTENT_REVIEW.md) |

## Personal-data incidents (GDPR Art. 33/34)
- A personal-data breach is reported to the supervisory authority **within 72 hours** of becoming aware of it, unless it is unlikely to result in a risk to learners. The owner decides and files; the record below documents the reasoning either way.
- Learners are told without undue delay when the risk to them is high, in plain language and in their interface language.
- Keep evidence: timestamps, affected tables and row counts, never the learners' data itself in this file or in an issue (the repository is public).

## Steps
1. **Contain:** redeploy the previous production build (Vercel instant rollback), revoke or rotate any exposed secret in Vercel/Supabase, disable the affected feature by configuration.
2. **Assess:** what happened, since when, which learners and data are affected, whether learner data left its intended boundary.
3. **Inform:** the owner immediately for S1/S2; learners and authority per the section above.
4. **Fix:** a small, reviewed change with a regression test; migrations follow expand → migrate → contract.
5. **Review:** write the post-mortem below within a week; add follow-up tasks to the [backlog](./BACKLOG.md).

## Post-mortem template
```markdown
### YYYY-MM-DD — short title (S1|S2|S3)
- Detected: when, by whom or what
- Impact: who and what was affected (counts only, no personal data)
- Timeline: detection → containment → fix → all clear (UTC)
- Cause: what failed and why the checks did not catch it
- Data: was personal data affected? Authority notified (date) or why not; learners informed (date)
- Fix: PR(s)
- Follow-ups: backlog IDs, each with an owner
```

## Record
No incidents recorded yet.
