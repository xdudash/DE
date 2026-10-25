# Core User Flows

## A — First visit
1. Choose an explanation language.
2. Choose a learning goal and daily study-time target in the study-plan wizard.
3. Choose an available route, review the plan, and save it on this device.
4. Continue to Home; the active route shapes its learning line and next-step recommendation.
5. Offer an optional five-question placement check. Label it a rough estimate, not an official CEFR result; the learner can ignore it and select any route.

## B — Learn a topic
1. Open a topic from search, map, route, or recommendation.
2. Display objectives, approximate level, prerequisites, and related concepts.
3. Study a structured explanation and contextual examples.
4. Complete exercises matching the learning objective, including sorting sentence chunks into grammar roles. Categorization reports a score per item and highlights the first targeted correction.
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

## K — Read, look up, and review a word (P4 pilot)
1. Open **Library** from the desktop navigation or phone tab bar and choose an original, level-labelled short story.
2. Read the German story. Marked words are keyboard buttons; opening a word shows its lemma, explanation-language meaning, and the complete sentence.
3. Save a word with its story id, exact token occurrence, sense gloss, and sentence. A repeated tap on the same occurrence never creates a duplicate; a different occurrence remains a separate context record.
4. Open **My vocabulary** from the library. Due words appear as cards, one at a time. The learner recalls before revealing the answer, then chooses **I remembered** or **Again**.
5. A remembered word advances through 1, 3, 7, 16, and 35 day intervals. **Again** returns it in ten minutes. The board also lists scheduled and due words and allows removal.
6. Vocabulary, context, and dates are local to this browser. They are excluded from account progress and cross-device claims until a lexicon/saved-vocabulary server contract is implemented.

## L — Choose and shape a learning route (device pilot)
1. Open **Edit route** from the Home learning line to see the available course lines, their level range, available lessons, and completion progress.
2. Choose the active route. Its line immediately drives the Home stations and the explainable next-step recommendation.
3. Reorder topics with the up/down controls, or skip topics for now. A skipped topic disappears from the Home line and route recommendation, but stays reachable from the Knowledge Map; completed evidence is never removed.
4. Restore skipped topics or reset a route to its authored order. The active route and its custom order are stored on this device and cleared by the existing delete-device-data action.
5. Changing a route never rewrites learning history. Account sync of route preferences can be added with the profile model later.

## M — Resume an interrupted lesson (device pilot)
1. Open a lesson or practical mission; its remaining step ids, completed answers, timer start, and practice mode are checkpointed in this browser.
2. Leave at any point. A correct answer advances the checkpoint immediately; a wrong answer keeps its scheduled retry in the saved queue.
3. On Home, choose **Continue lesson** to return to the exact remaining sequence, including a retry and the session result history.
4. Completing the lesson removes the checkpoint. Starting a fresh lesson replaces the single device-local checkpoint; clearing device data removes it.
5. If lesson content changes and saved step ids no longer match, discard the stale checkpoint and start with the current lesson. Checkpoints do not sync across devices.

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

Listening exercise: listen to a German sentence, replay on demand, choose its meaning, then review the correct choice and explanation. When browser speech is unavailable, the German transcript is shown.
Dictation exercise: play or replay a German sentence, type the full sentence, submit it for normalized comparison, then review the result and explanation. Show the transcript if speech synthesis is unavailable.
Error-correction exercise: inspect an incorrect sentence, rewrite it, submit the full sentence, and review either a targeted explanation for a known error or the general correction hint.


Minimal-pairs exercise: listen to the target word, play the candidate spellings one at a time, choose the matching word, and review the result. If speech synthesis is unavailable, show the target text and explain that the task is a spelling contrast.


## N — Guided writing practice
1. Open Writing Studio from Practice and choose an everyday or work situation.
2. Read the situation and the three points the message should cover.
3. Write a German draft; a live word count helps keep the response concise.
4. Review task coverage, clarity, verb position, spelling, and punctuation.
5. Mark the draft self-reviewed. Drafts stay on this device and are not automatically graded or included in learning-progress events.
