/**
 * Interface strings (not learning content). Kept separate from content/i18n by
 * design (LOCALIZATION_POLICY.md). Wave-1 languages only; others fall back to en.
 */
const strings = {
  en: {
    tagline: "German for life, work and study in Germany, Austria and Switzerland",
    chooseLanguage: "Explanation language",
    units: "Learning units",
    graph: "Knowledge map (first slice)",
    route: "Recommended route",
    status: "Status",
    planned: "planned — not authored yet",
    notReviewed: "Not yet reviewed by a qualified human reviewer.",
    machineDraft: "This translation is an unreviewed machine draft.",
    fallback: "Shown in English: no translation yet.",
    noPersistence: "Preview build: answers are checked, but progress is not saved yet (accounts arrive in a later phase).",
    prerequisites: "Before this",
    related: "Related topics",
    check: "Check",
    reset: "Reset",
    yourAnswer: "Your answer",
    tryAgain: "Try again",
    minutes: "min",
    back: "All topics",
  },
  ru: {
    tagline: "Немецкий для жизни, работы и учёбы в Германии, Австрии и Швейцарии",
    chooseLanguage: "Язык объяснений",
    units: "Учебные блоки",
    graph: "Карта знаний (первый фрагмент)",
    route: "Рекомендуемый маршрут",
    status: "Статус",
    planned: "запланировано — ещё не написано",
    notReviewed: "Ещё не проверено квалифицированным редактором.",
    machineDraft: "Этот перевод — непроверенный машинный черновик.",
    fallback: "Показано на английском: перевода пока нет.",
    noPersistence: "Предварительная сборка: ответы проверяются, но прогресс пока не сохраняется (аккаунты появятся на следующем этапе).",
    prerequisites: "Сначала нужно знать",
    related: "Связанные темы",
    check: "Проверить",
    reset: "Сбросить",
    yourAnswer: "Ваш ответ",
    tryAgain: "Попробовать снова",
    minutes: "мин",
    back: "Все темы",
  },
  uk: {
    tagline: "Німецька для життя, роботи й навчання в Німеччині, Австрії та Швейцарії",
    chooseLanguage: "Мова пояснень",
    units: "Навчальні блоки",
    graph: "Карта знань (перший фрагмент)",
    route: "Рекомендований маршрут",
    status: "Статус",
    planned: "заплановано — ще не написано",
    notReviewed: "Ще не перевірено кваліфікованим редактором.",
    machineDraft: "Цей переклад — неперевірена машинна чернетка.",
    fallback: "Показано англійською: перекладу поки немає.",
    noPersistence: "Попередня збірка: відповіді перевіряються, але прогрес поки не зберігається (акаунти з'являться на наступному етапі).",
    prerequisites: "Спершу потрібно знати",
    related: "Пов'язані теми",
    check: "Перевірити",
    reset: "Скинути",
    yourAnswer: "Ваша відповідь",
    tryAgain: "Спробувати ще",
    minutes: "хв",
    back: "Усі теми",
  },
} as const;

export type UiKey = keyof (typeof strings)["en"];
export type UiStrings = Record<UiKey, string>;

export function ui(lang: string): UiStrings {
  return (strings as Record<string, UiStrings>)[lang] ?? strings.en;
}
