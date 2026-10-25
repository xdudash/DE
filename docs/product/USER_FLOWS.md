# Core User Flows

## A — First visit
1. Choose explanation language, goal, DACH context, and daily study-time preference.
2. Take a diagnostic or enter a known starting level.
3. Explain that a diagnostic is an estimate, not an official CEFR certificate.
4. Show a recommended route and the reasons for its first steps.
5. Let the learner accept, edit, or bypass the route and browse topics directly.

## B — Learn a topic
1. Open a topic from search, map, route, or recommendation.
2. Display objectives, approximate level, prerequisites, and related concepts.
3. Study a structured explanation and contextual examples.
4. Complete exercises matching the learning objective.
5. Receive a reasoned answer explanation, not only a right/wrong indicator.
6. Record the attempt and update an appropriately cautious learning state.
7. Show related next steps while preserving freedom to choose another topic.

## C — Explore freely
1. Search or navigate to any available concept.
2. If prerequisites are missing or weak, explain the dependency.
3. Let the learner continue or open a catch-up sequence.
4. Keep the chosen goal and route available; exploration does not erase them.

## D — Read and collect vocabulary
1. Open a level-appropriate text with known source and reuse status.
2. Select a word/expression in context.
3. Show context-specific meaning, grammatical information, an example, and concept links.
4. Save the item with its context and attribution when applicable.
5. Add it to review; do not blindly merge distinct senses of one lemma.

## E — Review and adapt
1. Present due items according to the selected scheduler.
2. Collect recall evidence or learner confidence.
3. Update the review schedule and preserve history.
4. Let weak or frequently missed concepts influence recommendations.
5. Explain recommendations and allow the learner to override them.

### E1 — Review Room
1. Open the Review Room from a due recommendation on Home or the due-review panel in Practice.
2. See due topics oldest-first, the total queue, estimated time, and the source of current progress.
3. Choose 3, 5, or 10 topics; optionally remove individual topics from today's session.
4. Answer one existing authored exercise per selected topic. The same evaluator, feedback, hearts, and offline outbox used in practice apply.
5. A correct answer given while due advances the interval; a wrong answer resets it. An immediate retry cannot manufacture delayed-recall evidence.
6. When nothing is due, show the next scheduled review date and a route back to practice. If a due topic has no usable exercise, explain that limit and leave it out of the startable queue.

## H — Practical mission
1. Open Practice or the Home recommendation and choose a real-life DACH mission.
2. Read the setting and the goal of the conversation.
3. Respond to each authored German line using the supported reply exercise.
4. See the same targeted feedback and explanation as in a lesson.
5. Save each answer to the same learning history; replay the mission or open its full lesson.

## I — Account progress and device import
1. A signed-in learner fetches account events with a no-store request; the same progress appears on Home, Practice, the map, and You.
2. Device answers remain visible while offline and are marked local or waiting until the account confirms them.
3. Before importing, show eligible answers that include their original response and older answers that cannot be rechecked.
4. Ask for an explicit import action. The server validates the whole batch, re-evaluates each answer against the current lesson, ignores repeated event IDs, and dates imported evidence at import time.
5. On success, refresh account progress. On failure, keep local answers and show a retry action.
6. A second device reads the saved account history; signing out returns to that device's local history.

## J — Explainable next step
1. Rank a due review, repeated error, prerequisite catch-up, then the next available route step.
2. Show one direct action with its reason in plain language.
3. Let the learner continue along the line, choose another map topic, or dismiss the suggestion without losing the route.

## F — Listen, speak, and write
- Listening tasks include real audio, controlled replay, and suitable comprehension checks.
- Speaking tasks say whether they practise pronunciation, prepared speech, or conversation; assessment claims match actual capability.
- Writing tasks state purpose, audience, register, and evaluation criteria.
- Results distinguish automatic checks, heuristic/AI feedback, and human-reviewed assessment.

## G — Change goal or region
1. Change goal, starting level, or DACH context.
2. Preserve valid history.
3. Adapt recommendations and examples without erasing learned knowledge.
4. Label regional usage and retain the distinction from general standard German.

## Required cross-flow states
Loading, empty, success, validation error, recoverable failure, offline/unsynced, local-only, signed-out, import-ready, and synced states where relevant. Provide accessible keyboard navigation and mobile layouts. Never claim persistence or sync unless implemented and tested.
