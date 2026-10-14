import type { Catalog } from "./en.ts";

export const ru: Catalog = {
  "app.name": "DeutschGo",
  "app.tagline": "Немецкий для жизни, работы и учёбы в Германии, Австрии и Швейцарии",
  "app.chooseLanguage": "Язык объяснений",

  "nav.allTopics": "Все темы",
  "nav.route": "Рекомендуемый маршрут",
  "nav.knowledgeMap": "Карта знаний",

  "catalog.routeSummary": "{from}–{to} · {steps, plural, one {# шаг} few {# шага} many {# шагов} other {# шага}}",
  "catalog.unitMeta": "{level} · {minutes, plural, one {# минута} few {# минуты} many {# минут} other {# минуты}}",
  "catalog.plannedConcept": "запланировано — ещё не написано",
  "catalog.prerequisites": "Сначала нужно знать",
  "catalog.related": "Связанные темы",
  "catalog.conceptCount": "{count, plural, =0 {Тем пока нет} one {# тема} few {# темы} many {# тем} other {# темы}}",

  "status.label": "Статус",
  "status.notReviewed": "Ещё не проверено квалифицированным редактором.",
  "status.machineDraft": "Этот перевод — непроверенный машинный черновик.",
  "status.fallback": "Показано на языке {language}: перевода пока нет.",
  "status.noPersistence": "Предварительная сборка: ответы проверяются, но прогресс пока не сохраняется (аккаунты появятся на следующем этапе).",

  "exercise.check": "Проверить",
  "exercise.reset": "Сбросить",
  "exercise.tryAgain": "Попробовать снова",
  "exercise.yourAnswer": "Ваш ответ",
  "exercise.saveFailed": "Ответ проверен, но сохранить его не удалось. В вашем прогрессе он не появится.",
  "exercise.stale": "Этот урок обновлён. Перезагрузите страницу, чтобы продолжить с актуальной версией.",
  "exercise.progress": "Упражнение {current} из {total}",
  "exercise.score": "Правильно: {correct} из {total}",

  "state.unseen": "Не начато",
  "state.available": "Можно начинать",
  "state.in_progress": "В процессе",
  "state.needs_practice": "Нужна практика",
  "state.review_due": "Пора повторить",
  "state.provisionally_mastered": "Выглядит уверенно",

  "reason.requested": "Вы выбрали эту тему",
  "reason.prerequisite_of": "Нужно для темы «{topic}»",
  "reason.review_due": "Пора повторить",
  "reason.frequent_error": "Часто бывает ошибка",
  "reason.route_next": "Следующий шаг маршрута",

  "error.title": "Что-то пошло не так",
  "error.retry": "Попробовать снова",
  "error.contentMissing": "Эта тема пока недоступна.",
};
