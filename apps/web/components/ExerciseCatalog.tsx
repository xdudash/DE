"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const COPY: Record<string, { title: string; lead: string; search: string; count: string; empty: string; practice: string }> = {
  en: { title: "Exercise formats", lead: "Explore the 35 response formats the learning player can run. Counts show how often each format appears in the current authored lessons.", search: "Find a format", count: "{count} in lessons", empty: "No formats match this search.", practice: "Go to practice" },
  ru: { title: "Форматы упражнений", lead: "Здесь собраны 35 форматов, которые поддерживает плеер. Число показывает, сколько раз формат встречается в текущих уроках.", search: "Найти формат", count: "В уроках: {count}", empty: "По этому запросу форматы не найдены.", practice: "Перейти к практике" },
  uk: { title: "Формати вправ", lead: "Тут зібрано 35 форматів, які підтримує плеєр. Число показує, скільки разів формат трапляється в поточних уроках.", search: "Знайти формат", count: "В уроках: {count}", empty: "За цим запитом форматів не знайдено.", practice: "Перейти до практики" },
  ar: { title: "أنماط التمارين", lead: "استكشف 35 نمط إجابة يدعمها مشغل التعلم. يوضح العدد مرات ظهور كل نمط في الدروس الحالية.", search: "ابحث عن نمط", count: "في الدروس: {count}", empty: "لا توجد أنماط تطابق البحث.", practice: "انتقل إلى التدريب" },
};

const FORMATS = [
  "single_choice", "true_false", "match_pairs", "categorize", "listening_choice", "dictation", "error_correction", "reply_choice", "article_input", "form_input", "gap_fill_input", "spelling_input", "number_input", "time_input", "multi_choice", "word_order", "cloze", "transform", "minimal_pairs", "keyword_build", "token_bank_build", "verb_position", "negation", "connector_choice", "case_choice", "preposition_choice", "separable_verb", "read_question", "dialogue_gap", "modal_choice", "odd_one_out", "flashcard_recall", "translation_input", "join_halves", "stress_mark",
] as const;

type Format = typeof FORMATS[number];
const FORMAT_LABELS: Record<string, Partial<Record<Format, string>>> = {
  ru: {
    single_choice: "Выбрать один ответ", true_false: "Верно или неверно", match_pairs: "Составить пары", categorize: "Распределить по категориям", listening_choice: "Ответить по аудио", dictation: "Диктант", error_correction: "Исправить ошибку", reply_choice: "Выбрать ответ в диалоге", article_input: "Вписать артикль", form_input: "Ввести форму слова", gap_fill_input: "Заполнить пропуск", spelling_input: "Написать слово", number_input: "Ввести число", time_input: "Записать время", multi_choice: "Выбрать несколько ответов", word_order: "Собрать порядок слов", cloze: "Заполнить текст", transform: "Преобразовать фразу", minimal_pairs: "Различить звучание", keyword_build: "Собрать фразу по опорам", token_bank_build: "Собрать фразу из слов", verb_position: "Определить место глагола", negation: "Выбрать отрицание", connector_choice: "Выбрать союз", case_choice: "Выбрать падеж", preposition_choice: "Выбрать предлог", separable_verb: "Разделяемый глагол", read_question: "Ответить по тексту", dialogue_gap: "Заполнить реплику", modal_choice: "Выбрать модальный глагол", odd_one_out: "Найти лишнее", flashcard_recall: "Вспомнить значение", translation_input: "Перевести предложение", join_halves: "Соединить части", stress_mark: "Отметить ударный слог",
  },
  uk: {
    single_choice: "Обрати одну відповідь", true_false: "Правда чи неправда", match_pairs: "Утвори пари", categorize: "Розподіли за категоріями", listening_choice: "Відповідай на слух", dictation: "Диктант", error_correction: "Виправ помилку", reply_choice: "Обери відповідь у діалозі", article_input: "Впиши артикль", form_input: "Введи форму слова", gap_fill_input: "Заповни пропуск", spelling_input: "Напиши слово", number_input: "Введи число", time_input: "Запиши час", multi_choice: "Обери кілька відповідей", word_order: "Склади порядок слів", cloze: "Заповни текст", transform: "Перетвори фразу", minimal_pairs: "Розрізни звучання", keyword_build: "Склади фразу за підказками", token_bank_build: "Склади фразу зі слів", verb_position: "Визнач місце дієслова", negation: "Обери заперечення", connector_choice: "Обери сполучник", case_choice: "Обери відмінок", preposition_choice: "Обери прийменник", separable_verb: "Дієслово з відокремлюваною часткою", read_question: "Дай відповідь за текстом", dialogue_gap: "Заповни репліку", modal_choice: "Обери модальне дієслово", odd_one_out: "Знайди зайве", flashcard_recall: "Згадай значення", translation_input: "Переклади речення", join_halves: "З’єднай частини", stress_mark: "Познач наголошений склад",
  },
  ar: {
    single_choice: "اختر إجابة واحدة", true_false: "صحيح أم خطأ", match_pairs: "طابق الأزواج", categorize: "صنّف العناصر", listening_choice: "أجب بعد الاستماع", dictation: "إملاء", error_correction: "صحّح الخطأ", reply_choice: "اختر ردًا في الحوار", article_input: "أدخل أداة التعريف", form_input: "أدخل صيغة الكلمة", gap_fill_input: "أكمل الفراغ", spelling_input: "اكتب الكلمة", number_input: "أدخل الرقم", time_input: "اكتب الوقت", multi_choice: "اختر عدة إجابات", word_order: "رتّب الكلمات", cloze: "أكمل النص", transform: "حوّل الجملة", minimal_pairs: "ميّز بين الصوتين", keyword_build: "كوّن جملة من التلميحات", token_bank_build: "كوّن جملة من الكلمات", verb_position: "حدّد موقع الفعل", negation: "اختر النفي", connector_choice: "اختر أداة الربط", case_choice: "اختر الحالة الإعرابية", preposition_choice: "اختر حرف الجر", separable_verb: "الفعل القابل للانفصال", read_question: "أجب عن النص", dialogue_gap: "أكمل الحوار", modal_choice: "اختر الفعل الناقص", odd_one_out: "حدّد العنصر المختلف", flashcard_recall: "تذكّر المعنى", translation_input: "ترجم الجملة", join_halves: "صِل بين الجزأين", stress_mark: "حدّد المقطع المنبور",
  },
};

export function ExerciseCatalog({ lang, counts }: { lang: string; counts: Record<string, number> }) {
  const copy = COPY[lang] ?? COPY.en!;
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(lang);
    return FORMATS.filter((format) => {
      const id = format.replaceAll("_", " ").toLocaleLowerCase(lang);
      const label = (FORMAT_LABELS[lang]?.[format] ?? id).toLocaleLowerCase(lang);
      return id.includes(needle) || label.includes(needle);
    });
  }, [lang, query]);
  return <main className="page exercise-catalog">
    <p className="eyebrow">DeutschGo</p>
    <h1>{copy.title}</h1>
    <p className="lead">{copy.lead}</p>
    <label className="catalog-search"><span>{copy.search}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
    <p className="muted small" aria-live="polite"><bdi dir="ltr">{visible.length} / {FORMATS.length}</bdi></p>
    {visible.length ? <ul className="catalog-grid">{visible.map((format) => <li className="card catalog-format" key={format}>
      <span className="catalog-format-icon" aria-hidden="true">✳</span>
      <h2 lang={lang === "ar" ? "ar" : undefined}>{FORMAT_LABELS[lang]?.[format] ?? format.replaceAll("_", " ")}</h2>
      <p className="muted small">{copy.count.replace("{count}", String(counts[format] ?? 0))}</p>
    </li>)}</ul> : <p className="card muted">{copy.empty}</p>}
    <Link className="btn btn-secondary" href={`/${lang}/practice`}>{copy.practice}</Link>
  </main>;
}
