# Architecture Decision Records (ADRs)

ADRs document significant decisions so future work does not silently reopen or contradict them.

## When to write one
Record choices affecting data ownership, privacy/security, deployability, operating cost, major dependencies, content format, provider lock-in, or difficult-to-reverse boundaries. Not every small coding choice needs an ADR.

## Workflow
1. State the problem and constraints.
2. List realistic alternatives, including doing nothing when relevant.
3. Compare effort, cost, portability/lock-in, quality, accessibility, security/privacy, and maintenance.
4. Recommend an option and explain trade-offs.
5. Mark it Proposed, Accepted, Superseded, or Rejected.
6. Update affected docs after acceptance.

## Filename
Use a monotonic identifier and short topic, e.g. ADR-0001-frontend-stack.md.

## Template
~~~markdown
# ADR-NNNN: Short decision title

- Status: Proposed | Accepted | Superseded | Rejected
- Date: YYYY-MM-DD
- Decision owner: Project owner

## Context
What problem must be solved? Which constraints matter?

## Options considered
### Option A
Advantages, disadvantages, costs, risks.

### Option B
Advantages, disadvantages, costs, risks.

## Decision
Chosen option and why it fits the constraints.

## Consequences
Benefits, trade-offs, migration implications, new obligations.

## Verification
What must be tested to confirm the decision works?
~~~

No final technology decision has been made. Do not fabricate ADRs as if they were accepted.
