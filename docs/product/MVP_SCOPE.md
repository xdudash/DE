# MVP Scope

## Purpose
The MVP is the smallest real, testable version that proves the DeutschGo learning model. It must complete an end-to-end learning journey rather than show many screens with fake functionality.

## Target outcome
A learner can set a goal and explanation language, assess a starting point, choose or receive a path, study a well-authored topic, practise it, save vocabulary, revisit earlier material, and see an explainable next step.

## MVP capabilities
### Learner setup
- Select goal, DACH context (Germany, Austria, Switzerland, or general standard German), explanation/interface language, and daily study-time preference.
- Support an initial approved set of 5–10 explanation/interface languages, with an explicit policy for reviewed content coverage.
- Persist settings according to the approved architecture.

### Navigation and learning route
- Browse and search the knowledge graph/topic catalogue.
- Show topic level, objectives, prerequisites, and related topics.
- Allow opening a topic out of sequence. Explain missing prerequisites and offer catch-up options rather than silently blocking exploration.
- Show an editable recommended route.

### Learning session
- Provide one complete, reviewed reference lesson and a small representative set of lesson types before content expansion.
- Present accurate explanations, contextual examples, relevant variation/exceptions, and common mistakes.
- Provide exercises with defensible answer checking and explanatory feedback.
- Persist attempts and transparent learning states.
- Link units to underlying concepts.

### Reading and vocabulary
- Provide a small rights-cleared reading pilot with selectable words and contextual explanations.
- Save vocabulary with sense, example, explanation language, and source/context.
- Review saved items with a configurable spaced-repetition approach.
- Do not treat a bare word/translation pair as sufficient when sense or grammar matters.

### Progress
- Distinguish exposure, practice, performance, recall, and mastery estimates.
- Track skill progress only to the extent that each skill is genuinely assessed.
- Explain the recommendation for the next step.

### Quality
- Validate authored content against versioned contracts.
- Run automated checks on pull requests.
- Separate content from UI implementation.
- Avoid secrets and real learner data in source control.

## Freemium readiness
The product model must support free and subscription entitlements. Select a billing provider only after pricing, access rules, legal requirements, and platform constraints are considered. The release plan must state whether live payments are included in the initial MVP or a subsequent step.

## Explicitly deferred unless validated as essential
- An always-available AI chat tutor.
- AI grading that claims objective pronunciation or fluency measurement.
- Native iOS and Android builds in parallel with the first web release.
- Social feeds, leaderboards, and competitive gamification.
- Importing entire commercial books, paid course material, or audio libraries.
- Microservices or infrastructure sized for millions before evidence of demand.
- Thousands of lessons before the schema, reference lesson, and QA process are proven.

## MVP acceptance criteria
1. A learner can complete the core journey without a broken step.
2. A reference learning path and representative lesson set are reviewed linguistically and pedagogically.
3. Every exercise has a verifiable answer model or documented evaluation rubric.
4. Content links and prerequisites validate automatically.
5. Progress persists across the session/device boundary promised by the architecture.
6. Learners can browse beyond a fixed sequence without losing their learning route.
7. Unsupported or unfinished capabilities are labelled honestly.
8. Required automated checks and the release checklist pass.
