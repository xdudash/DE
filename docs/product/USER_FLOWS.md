# Core User Flows

## A — First visit
1. Choose an explanation language.
2. Open the study-plan wizard directly from the language choice.
3. Choose a learning goal and daily study-time target; offer an optional five-question placement check, clearly labelled as a rough estimate rather than an official CEFR result.
4. Choose an available route, review the plan, and save it on this device.
5. Continue to Home; the active route shapes its learning line and next-step recommendation, with the first available lesson ready to start.

## A1 — Return from the language gate
1. Offer the last used explanation language as a direct route back to Home.
2. Language cards also lead to Home when this browser already has a saved plan, learning answers, or an unfinished lesson.
3. Preserve the route, next-step recommendation, and lesson-resume action from that local state.

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

### C1 — Catch up before a topic
1. Open the Knowledge Map and find a target concept by search, level, type, or learning state.
2. Expand **Build catch-up path** to see unmet transitive prerequisites in dependency order.
3. Start the first available prerequisite lesson. Completed evidence is re-read by the map, so the remaining path shortens as the learner progresses.
4. If a required topic has no lesson yet, show it as planned and explain the limit; keep the target topic open for direct exploration.

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

### I1 — Export or clear device data
1. Open **You** and review which learning data is stored in this browser.
2. Choose **Export device data** to download a versioned JSON snapshot containing DeutschGo local-storage entries, including route, setup, attempts, checkpoints, vocabulary and writing drafts.
3. The export is created locally in the browser; no upload is made. Account data is exported separately from the signed-in account panel.
4. To delete device data, open the inline confirmation and confirm. The app removes its local state and reports success only when storage confirms the data was removed. Account data remains available until separately deleted.

## J — Explainable next step
1. Rank a due review, repeated error, prerequisite catch-up, then the next available route step.
2. Skip route topics that have no startable lesson; keep them visible as planned on the line and Knowledge Map.
3. Show one direct action to a startable lesson or review with its reason in plain language.
4. Let the learner continue along the line, choose another map topic, or dismiss the suggestion without losing the route.

## K — Read, look up, and review a word (P4 pilot)
1. Open **Library** from the desktop navigation or phone tab bar and choose an original, level-labelled short story.
2. Read the German story. Marked words are keyboard buttons; opening a word shows its lemma, explanation-language meaning, and the complete sentence.
3. Save a word with its story id, exact token occurrence, sense gloss, and sentence. A repeated tap on the same occurrence never creates a duplicate; a different occurrence remains a separate context record.
4. Open **My vocabulary** from the library. Due words appear as cards, one at a time. The learner recalls before revealing the answer, then chooses **I remembered** or **Again**.
5. A remembered word advances through 1, 3, 7, 16, and 35 day intervals. **Again** returns it in ten minutes. The board also lists scheduled and due words and allows removal.
6. Vocabulary, context, and dates are local to this browser. They are excluded from account progress and cross-device claims until a lexicon/saved-vocabulary server contract is implemented.

### K1 — Search the contextual dictionary
1. Open Dictionary from the Library or from a selected word in a story.
2. Search by the displayed German form, lemma, or localized meaning; a `?q=` link preloads the selected story word.
3. Select a result to see its meaning, the sentence it came from, and a link back to that story.
4. Save the exact occurrence to My vocabulary. The existing occurrence id makes repeat saves idempotent, and the word uses the same due schedule as words saved in the reader.
5. If no entry matches, adjust the query or return to the Library. Only glossed words from the available original stories appear in the pilot dictionary.

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
1. Open Writing Studio from Practice and choose an everyday/work situation or an illustrated picture prompt.
2. Read the situation and the three points the message should cover.
3. Write a German draft; a live word count helps keep the response concise.
4. Review task coverage, clarity, verb position, spelling, and punctuation.
5. Mark the draft self-reviewed. Drafts stay on this device and are not automatically graded or included in learning-progress events.


## N — Speak, record, and review (device session)
1. Open Speaking workshop from Practice and choose a café, appointment, or introduction scenario.
2. Read the purpose and German response, or hear it with the browser's German voice.
3. Recording begins only after the learner presses the microphone action and grants browser permission. Stop recording to create an in-page playback.
4. Play back or delete the recording. It is held only in page memory, never uploaded, and disappears when the page is left or refreshed.
5. State clearly that no pronunciation score or automated assessment is provided; show a fallback when microphone recording is unsupported.


## O — Inspect learning progress
1. Open the progress board from the profile.
2. Read answer totals, accuracy, recent activity, and concept states derived from saved evidence; show an empty state before the first answer.
3. Filter saved attempts by knowledge, reading, listening, writing, or speaking.
4. Expand a practiced topic to inspect its correct/total count, current evidence state, and timestamped answer history; follow a source lesson or open the topic on the map.
5. Keep the account-versus-device source visible and return to Home, Map, or Practice.
