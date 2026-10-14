import type { Catalog } from "./en.ts";

/**
 * RTL SMOKE CATALOG — not offered to learners.
 *
 * Arabic is a wave-2 language (docs/domain/LOCALIZATION_POLICY.md). This catalog
 * exists so the right-to-left layout is exercised by tests and screenshots from the
 * start, long before Arabic explanations exist. It is an unreviewed machine draft and
 * `isPreviewLocale("ar")` is true, which keeps it out of the language picker.
 *
 * Arabic uses six plural categories (zero, one, two, few, many, other); the arms below
 * cover them so the formatter's Intl.PluralRules path is tested against a language
 * whose rules differ from English and Slavic ones.
 */
export const ar: Catalog = {
  "app.name": "DeutschGo",
  "app.tagline": "الألمانية للحياة والعمل والدراسة في ألمانيا والنمسا وسويسرا",
  "app.chooseLanguage": "لغة الشرح",

  "nav.allTopics": "كل الموضوعات",
  "nav.route": "المسار المقترح",
  "nav.knowledgeMap": "خريطة المعرفة",

  "catalog.routeSummary": "{from}–{to} · {steps, plural, zero {لا خطوات} one {خطوة واحدة} two {خطوتان} few {# خطوات} many {# خطوة} other {# خطوة}}",
  "catalog.unitMeta": "{level} · {minutes, plural, zero {بدون وقت} one {دقيقة واحدة} two {دقيقتان} few {# دقائق} many {# دقيقة} other {# دقيقة}}",
  "catalog.plannedConcept": "مُخطَّط — لم يُكتب بعد",
  "catalog.prerequisites": "قبل ذلك",
  "catalog.related": "موضوعات ذات صلة",
  "catalog.conceptCount": "{count, plural, =0 {لا توجد موضوعات بعد} one {موضوع واحد} two {موضوعان} few {# موضوعات} many {# موضوعًا} other {# موضوع}}",

  "status.label": "الحالة",
  "status.notReviewed": "لم يراجعه مراجع مؤهل بعد.",
  "status.machineDraft": "هذه الترجمة مسودة آلية غير مراجعة.",
  "status.fallback": "معروض بلغة {language}: لا توجد ترجمة بعد.",
  "status.noPersistence": "إصدار تجريبي: يتم التحقق من الأجوبة، لكن التقدم لا يُحفظ بعد.",

  "exercise.check": "تحقق",
  "exercise.reset": "إعادة",
  "exercise.tryAgain": "حاول مرة أخرى",
  "exercise.yourAnswer": "إجابتك",
  "exercise.progress": "التمرين {current} من {total}",
  "exercise.score": "{correct} صحيحة من {total}",

  "state.unseen": "لم يبدأ",
  "state.available": "جاهز للبدء",
  "state.in_progress": "قيد التقدم",
  "state.needs_practice": "يحتاج تدريبًا",
  "state.review_due": "حان وقت المراجعة",
  "state.provisionally_mastered": "يبدو متيناً",

  "reason.requested": "لقد اخترت هذا الموضوع",
  "reason.prerequisite_of": "مطلوب لموضوع {topic}",
  "reason.review_due": "حان وقت المراجعة",
  "reason.frequent_error": "يُجاب عنه خطأً كثيرًا",
  "reason.route_next": "الخطوة التالية في مسارك",

  "error.title": "حدث خطأ ما",
  "error.retry": "حاول مرة أخرى",
  "error.contentMissing": "هذا الموضوع غير متاح بعد.",
};
