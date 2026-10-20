/**
 * English interface catalog — the source of truth for keys and placeholders.
 * Every other catalog must define exactly these keys with the same placeholders
 * (enforced by test/catalogs.test.ts).
 *
 * These are INTERFACE strings. Explanations of German live in content/i18n/.
 */
export const en = {
  "app.name": "DeutschGo",
  "app.tagline": "German for life, work and study in Germany, Austria and Switzerland",
  "app.chooseLanguage": "Explanation language",

  "home.start": "Start here",
  "home.intro": "A complete German course for life, work and study in Germany, Austria and Switzerland. Each lesson explains the rule, shows it in real sentences, and checks your answers with reasons.",
  "home.startCta": "Start the first lesson",
  "home.startNote": "One complete lesson is ready now. Other topics show as planned until they are written and reviewed by a human reviewer.",

  "nav.allTopics": "All topics",
  "nav.route": "Recommended route",
  "nav.knowledgeMap": "Knowledge map",

  "catalog.routeSummary": "{from}–{to} · {steps, plural, one {# step} other {# steps}}",
  "catalog.unitMeta": "{level} · {minutes, plural, one {# minute} other {# minutes}}",
  "catalog.plannedConcept": "planned — not authored yet",
  "catalog.prerequisites": "Before this",
  "catalog.related": "Related topics",
  "catalog.conceptCount": "{count, plural, =0 {No topics yet} one {# topic} other {# topics}}",

  "status.draftTag": "Not reviewed",
  "status.label": "Status",
  "status.notReviewed": "Not yet reviewed by a qualified human reviewer.",
  "status.machineDraft": "This translation is an unreviewed machine draft.",
  "status.fallback": "Shown in {language}: no translation yet.",
  "status.noPersistence": "Preview build: answers are checked, but progress is not saved yet (accounts arrive in a later phase).",

  "exercise.check": "Check",
  "exercise.reset": "Reset",
  "exercise.tryAgain": "Try again",
  "exercise.yourAnswer": "Your answer",
  "exercise.saveFailed": "Your answer was checked, but saving it did not work. It will not appear in your progress.",
  "exercise.stale": "This lesson has been updated. Reload the page to continue with the current version.",
  "exercise.progress": "Exercise {current} of {total}",
  "exercise.score": "{correct} of {total} correct",

  "state.unseen": "Not started",
  "state.available": "Ready to start",
  "state.in_progress": "In progress",
  "state.needs_practice": "Needs practice",
  "state.review_due": "Review due",
  "state.provisionally_mastered": "Looks solid",

  "reason.requested": "You chose this topic",
  "reason.prerequisite_of": "Needed for {topic}",
  "reason.review_due": "Review due",
  "reason.frequent_error": "Often answered wrongly",
  "reason.route_next": "Next step on your route",

  "setup.goalLabel": "What do you need German for?",
  "setup.goal.life": "Daily life",
  "setup.goal.work": "Work",
  "setup.goal.study": "Study",
  "setup.minutesLabel": "Time per day",
  "setup.minutes": "{minutes} min",
  "setup.save": "Save my plan",
  "setup.saved": "Your plan on this device: {goal}, {minutes} a day.",
  "setup.deviceOnly": "Saved only in this browser until accounts arrive.",
  "setup.failed": "Could not save on this device. Your plan is not stored.",
  "lesson.summary": "Your result",
  "lesson.notDone": "Answer every exercise to see your result. Answered so far: {answered} of {total}.",
  "lesson.deviceOnly": "Your result is kept in this browser only.",
  "lesson.next": "Next lesson",
  "lesson.noNext": "More lessons appear here once they are written and reviewed.",

  "nav.home": "Home",
  "nav.main": "Main",
  "home.nextStep": "Your next step",
  "home.nextEmpty": "Start the first lesson to see your next step here.",
  "map.search": "Search topics",
  "map.noMatch": "No topics match this search.",
  "map.onDevice": "States are based only on answers in this browser.",

  "nav.tabs": "App sections",
  "gate.continue": "Continue",
  "gate.point.explanations": "Clear rules, real sentences, and feedback that says why.",
  "gate.point.route": "A route from your first sentence to talking about the past.",
  "gate.point.free": "Free while it is being built.",
  "pwa.install": "Install app",
  "pwa.installHint": "Adds DeutschGo to your home screen. Lessons you have opened stay readable without a connection.",
  "offline.title": "No connection",
  "offline.body": "Pages you have already opened are still readable. Reconnect to open new ones.",

  "error.title": "Something went wrong",
  "error.retry": "Try again",
  "error.contentMissing": "This topic is not available yet.",
} as const;

export type MessageKey = keyof typeof en;
export type Catalog = Record<MessageKey, string>;
