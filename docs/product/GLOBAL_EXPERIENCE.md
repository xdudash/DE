# DeutschGo Global Experience Blueprint

Status: implementation brief for the 2026-10-25 product-wide learner experience update.

## Product promise

DeutschGo helps people living, working, and studying in Germany, Austria, and Switzerland understand German and use it in real situations. The product combines a connected map of German, clear explanations in the learner's language, evidence-based practice, and practical DACH missions. It stays useful without an account and continues across devices after sign-in.

The differentiator is a visible link between **what the learner got wrong**, **the German idea behind it**, and **the next useful action**. A mission is never a generic chat: it practises real, authored German and points back to the concepts it uses. Any generated feedback or speech assessment must be labelled and must only claim what it can measure.

## Global navigation and screen map

| Section | Main purpose | Important paths |
|---|---|---|
| Home | Continue the learning line and see today's focus | Continue lesson · review due items · start a practical mission |
| Practice | Repair weak spots and use German in context | Due reviews · frequent errors · DACH missions · retry a lesson |
| Knowledge map | Find and understand any topic | Search · topic state · prerequisite/catch-up path · open lesson |
| You | Own the plan, account, progress and data | Goals and time · language · reminders · sync/import · export/delete |

The current four-section navigation remains the stable frame. New learning modes are surfaced inside Practice and on Home, so they are discoverable without burying the course under more tabs.

## End-to-end learner paths

### 1. First visit and course choice

1. Choose an explanation language that has content coverage.
2. Choose a goal, DACH context, and realistic daily time.
3. Start at the beginning or choose a known starting point; a future placement estimate must include confidence and must never be presented as certification.
4. See a recommended line with the next real lesson, its reason, and a visible way to explore other topics.
5. Start a lesson without creating an account. Answers remain on this device until the learner signs in and chooses to import eligible history.

### 2. Daily learning loop

1. Home shows one clear action: continue the current lesson, review the most overdue concept, or begin the next lesson.
2. A short daily goal shows completed answers and the learner's chosen target.
3. The next-step card explains its reason: due review, repeated error, prerequisite, or next route step.
4. The learner can accept the suggestion or go directly to Practice, the Knowledge map, or another lesson.
5. On answer, the app evaluates immediately, explains why, stores the same event ID on device and server, and refreshes the route/progress views.

### 3. Lesson and recovery path

1. The lesson shows its objective, structured explanation, examples, and progress.
2. Each response gives the verdict, the exact answer, and the relevant explanation; a wrong answer is revisited once at the end.
3. The answer updates concept evidence and review timing.
4. The arrival screen summarizes first-try accuracy, XP and elapsed time, then offers the next useful action: next lesson, review a weak concept, retry, or return to the line.

### 4. Smart practice and real-life missions

1. Practice separates **Review** (spaced recall) from **Missions** (a practical DACH situation).
2. Reviews are ordered by due time; frequent mistakes appear with the concept that needs work.
3. A mission card names the setting and practical outcome: for example, order at a café, ask a question at a market, or introduce yourself in a course.
4. In mission mode, a conversation advances one response at a time using the same evaluator and feedback as lessons. The learner can replay the scene or open its full lesson.
5. Every mission answer feeds the same learning evidence, recommendations, and progress totals.

### 5. Explore the knowledge map

1. Search localized topic titles and German forms.
2. Each topic shows level, current learning state, and prerequisites.
3. A missing prerequisite offers a short catch-up path; it never blocks the learner.
4. Opening a topic does not erase or reorder the active route.

### 6. Account, devices, privacy

1. Preview learning works without sign-in.
2. Sign-in saves new answers to the account; the same evidence can be loaded on another device.
3. Before importing local history, the learner sees how many answers can be rechecked. The server re-evaluates every response; old device timestamps are treated as imported practice on the import date so local clock edits cannot manufacture spaced mastery.
4. Answers from old app versions without their original response cannot be rechecked; the UI reports this count and leaves those answers on the original device.
5. The learner can export account data, delete the account, clear this device, and see whether current progress is local, saved, waiting, or unavailable.

### 7. Goal, language, and regional context

Changing goal, daily time, explanation language, or region updates recommendations and examples while retaining learning evidence. Austrian and Swiss language notes remain explicitly labelled; they never rewrite the standard German rule.

### 8. Future skill paths

Reading, saved words, listening, writing, speaking, placement, billing, content operations, analytics, and native apps follow the same rules: real content only, linked to the knowledge graph, honest evaluation, privacy by default, and a useful offline/empty/error state. These need their planned content, review, provider, or legal gates before the UI can claim they work.

## Shared system rules

- One canonical event per answer; device and account copies share its ID.
- Server answers are re-evaluated before they enter account progress.
- Account data is scoped to the authenticated learner through RLS.
- Local progress remains available while offline; a network problem never erases a checked answer.
- Loading, empty, success, retryable failure, stale content, offline, queued, signed-out, and synced states have explicit UI.
- Every screen supports keyboard navigation, screen readers, RTL mirroring, 320px phone width, and reduced motion.
- A lesson or translation needing human review is never represented as approved.

## Mockups

The SVGs are screen-level layout references for implementation and review:

- [Home and next step](./mockups/home.svg)
- [Practice and DACH missions](./mockups/practice.svg)
- [A full conversational mission](./mockups/mission.svg)
- [Progress and account sync](./mockups/progress.svg)

They use the accepted Linie visual system: transit-blue actions, green evidence, quiet surfaces, and no decorative colour that could be confused with a language marker.

## Implementation boundary for this release slice

This update completes the account progress read path, safe re-evaluated import, shared progress display, explainable next step, and a mission mode over existing scenario exercises. Future areas above remain represented in the journey map and roadmap but stay gated until their real content, reviewer, legal, or provider prerequisites exist.
