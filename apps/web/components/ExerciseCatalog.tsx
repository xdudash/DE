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

export function ExerciseCatalog({ lang, counts }: { lang: string; counts: Record<string, number> }) {
  const copy = COPY[lang] ?? COPY.en!;
  const [query, setQuery] = useState("");
  const visible = useMemo(() => FORMATS.filter((format) => format.replaceAll("_", " ").includes(query.trim().toLowerCase())), [query]);
  return <main className="page exercise-catalog">
    <p className="eyebrow">DeutschGo</p>
    <h1>{copy.title}</h1>
    <p className="lead">{copy.lead}</p>
    <label className="catalog-search"><span>{copy.search}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
    <p className="muted small" aria-live="polite">{visible.length} / {FORMATS.length}</p>
    {visible.length ? <ul className="catalog-grid">{visible.map((format) => <li className="card catalog-format" key={format}>
      <span className="catalog-format-icon" aria-hidden="true">✳</span>
      <h2>{format.replaceAll("_", " ")}</h2>
      <p className="muted small">{copy.count.replace("{count}", String(counts[format] ?? 0))}</p>
    </li>)}</ul> : <p className="card muted">{copy.empty}</p>}
    <Link className="btn btn-secondary" href={`/${lang}/practice`}>{copy.practice}</Link>
  </main>;
}
