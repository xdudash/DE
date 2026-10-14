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

  "nav.allTopics": "All topics",
  "nav.route": "Recommended route",
  "nav.knowledgeMap": "Knowledge map",

  "catalog.routeSummary": "{from}–{to} · {steps, plural, one {# step} other {# steps}}",
  "catalog.unitMeta": "{level} · {minutes, plural, one {# minute} other {# minutes}}",
  "catalog.plannedConcept": "planned — not authored yet",
  "catalog.prerequisites": "Before this",
  "catalog.related": "Related topics",
  "catalog.conceptCount": "{count, plural, =0 {No topics yet} one {# topic} other {# topics}}",

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

  "error.title": "Something went wrong",
  "error.retry": "Try again",
  "error.contentMissing": "This topic is not available yet.",
} as const;

export type MessageKey = keyof typeof en;
export type Catalog = Record<MessageKey, string>;
