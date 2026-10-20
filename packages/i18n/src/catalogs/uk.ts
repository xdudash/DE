import type { Catalog } from "./en.ts";

export const uk: Catalog = {
  "app.name": "DeutschGo",
  "app.tagline": "Німецька для життя, роботи й навчання в Німеччині, Австрії та Швейцарії",
  "app.chooseLanguage": "Мова пояснень",

  "home.start": "Почніть тут",
  "home.intro": "Повний курс німецької для життя, роботи й навчання в Німеччині, Австрії та Швейцарії. Кожен урок пояснює правило, показує його на живих реченнях і перевіряє відповіді з поясненням.",
  "home.startCta": "Почати перший урок",
  "home.startNote": "Зараз готовий один повний урок. Інші теми позначені як заплановані, доки їх не напишуть і не перевірить людина-рецензент.",

  "nav.allTopics": "Усі теми",
  "nav.route": "Рекомендований маршрут",
  "nav.knowledgeMap": "Карта знань",

  "catalog.routeSummary": "{from}–{to} · {steps, plural, one {# крок} few {# кроки} many {# кроків} other {# кроку}}",
  "catalog.unitMeta": "{level} · {minutes, plural, one {# хвилина} few {# хвилини} many {# хвилин} other {# хвилини}}",
  "catalog.plannedConcept": "заплановано — ще не написано",
  "catalog.prerequisites": "Спершу потрібно знати",
  "catalog.related": "Пов'язані теми",
  "catalog.conceptCount": "{count, plural, =0 {Тем ще немає} one {# тема} few {# теми} many {# тем} other {# теми}}",

  "status.label": "Статус",
  "status.notReviewed": "Ще не перевірено кваліфікованим редактором.",
  "status.machineDraft": "Цей переклад — неперевірена машинна чернетка.",
  "status.fallback": "Показано мовою {language}: перекладу поки немає.",
  "status.noPersistence": "Попередня збірка: відповіді перевіряються, але прогрес поки не зберігається (акаунти з'являться на наступному етапі).",

  "exercise.check": "Перевірити",
  "exercise.reset": "Скинути",
  "exercise.tryAgain": "Спробувати ще",
  "exercise.yourAnswer": "Ваша відповідь",
  "exercise.saveFailed": "Відповідь перевірено, але зберегти її не вдалося. У вашому прогресі вона не з'явиться.",
  "exercise.stale": "Цей урок оновлено. Перезавантажте сторінку, щоб продовжити з актуальною версією.",
  "exercise.progress": "Вправа {current} з {total}",
  "exercise.score": "Правильно: {correct} з {total}",

  "state.unseen": "Не розпочато",
  "state.available": "Можна починати",
  "state.in_progress": "У процесі",
  "state.needs_practice": "Потрібна практика",
  "state.review_due": "Час повторити",
  "state.provisionally_mastered": "Виглядає впевнено",

  "reason.requested": "Ви обрали цю тему",
  "reason.prerequisite_of": "Потрібно для теми «{topic}»",
  "reason.review_due": "Час повторити",
  "reason.frequent_error": "Часто буває помилка",
  "reason.route_next": "Наступний крок маршруту",

  "error.title": "Щось пішло не так",
  "error.retry": "Спробувати ще",
  "error.contentMissing": "Ця тема поки недоступна.",
};
