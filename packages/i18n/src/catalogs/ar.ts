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

  "home.start": "ابدأ هنا",
  "home.intro": "دورة ألمانية كاملة للحياة والعمل والدراسة في ألمانيا والنمسا وسويسرا. يشرح كل درس القاعدة، ويعرضها في جمل حقيقية، ويتحقق من إجاباتك مع توضيح السبب.",
  "home.startCta": "ابدأ الدرس الأول",
  "home.startNote": "درس كامل واحد جاهز الآن. تظهر الموضوعات الأخرى كمخططة حتى تُكتب وتُراجعها مراجعة بشرية.",

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
  "exercise.saveFailed": "تم التحقق من إجابتك، لكن تعذّر حفظها. لن تظهر في تقدّمك.",
  "exercise.stale": "تم تحديث هذا الدرس. أعد تحميل الصفحة للمتابعة بالإصدار الحالي.",
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

  "setup.goalLabel": "ما الذي تحتاج الألمانية من أجله؟",
  "setup.goal.life": "الحياة اليومية",
  "setup.goal.work": "العمل",
  "setup.goal.study": "الدراسة",
  "setup.minutesLabel": "الوقت في اليوم",
  "setup.minutes": "{minutes} د",
  "setup.save": "احفظ خطتي",
  "setup.saved": "خطتك على هذا الجهاز: {goal}، {minutes} يوميًا.",
  "setup.deviceOnly": "تُحفظ في هذا المتصفح فقط إلى أن تتوفر الحسابات.",
  "setup.failed": "تعذّر الحفظ على هذا الجهاز. لم تُحفظ خطتك.",
  "lesson.summary": "نتيجتك",
  "lesson.notDone": "أجب عن كل التمارين لترى نتيجتك. أجبت حتى الآن: {answered} من {total}.",
  "lesson.deviceOnly": "تُحفظ نتيجتك في هذا المتصفح فقط.",
  "lesson.next": "الدرس التالي",
  "lesson.noNext": "تظهر دروس أخرى هنا بعد كتابتها ومراجعتها.",

  "error.title": "حدث خطأ ما",
  "error.retry": "حاول مرة أخرى",
  "error.contentMissing": "هذا الموضوع غير متاح بعد.",
};
