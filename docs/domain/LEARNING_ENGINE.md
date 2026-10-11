# Learning Engine

## Goals
Help learners understand what they can use reliably, what to practise next and why, and how to study a chosen topic without ignoring relevant prerequisites.

## Keep signals separate
- Exposure: the learner saw/opened material.
- Practice: attempts were made.
- Performance: results on defined tasks.
- Recall: retrieval after a delay.
- Transfer: use in a different context or skill.
- Mastery estimate: cautious inference from several relevant signals.

Time-on-screen and streaks are not evidence of mastery.

## Initial topic states
Possible states are unseen, available, in_progress, needs_practice, review_due, and provisionally_mastered. Final transitions must be documented and tested before learner data is collected. Mastery may be revised by later evidence.

## Explainable recommendation order
1. Respect the learner's selected goal and current request.
2. Handle availability and mandatory prerequisites.
3. Offer a catch-up step when missing knowledge is likely to block the task.
4. Consider due review and recently weak concepts.
5. Suggest a curriculum item that advances the selected goal.
6. Show a human-readable reason and permit override.

Reasons may include “review due”, “frequently missed”, “prerequisite for your chosen topic”, or “matches your work goal”.

## Diagnostics
- A diagnostic is an estimate, never an official CEFR certificate.
- Use multiple evidence types when making broad proficiency claims.
- Reflect uncertainty; a small sample must not create false precision.
- Let learners edit the inferred starting point.
- Track diagnostic version so old results remain interpretable.

## Spaced repetition
A simple transparent scheduler is sufficient for the first version. Define what counts as successful recall before choosing an algorithm. Preserve review history and test time boundaries, repeated failure, and “again” versus successful recall. Do not assume one schedule fits every content type.

## Four skills
- Reading comprehension needs text-based evidence.
- Listening comprehension needs actual audio exposure or a clearly described alternative.
- Writing needs prompt, audience/register, and criteria; automatic checks are not a full assessment.
- Speaking practice must distinguish prepared production, transcription, pronunciation, and conversation. Do not claim objective pronunciation assessment without a validated method.

## Personalization and privacy
Begin without a black-box model. Recommendations must be explainable and user-controllable. Store only necessary evidence and define retention, access, export, and deletion rules in the approved architecture.
