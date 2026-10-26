"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type CatalogCopy = { title: string; lead: string; search: string; count: string; empty: string; practice: string; preview: string; close: string; prompt: string; answer: string; choose: string; demo: string; audio: string; playing: string; reveal: string; revealed: string; selected: string; written: string; tokens: string[]; options: string[]; inputHint: string };
const COPY: Record<string, CatalogCopy> = {
  en: { title: "Exercise formats", lead: "Explore all 35 response formats in the learning player. Open a format to preview how learners interact with it.", search: "Find a format", count: "{count} in lessons", empty: "No formats match this search.", practice: "Go to practice", preview: "Preview interaction", close: "Close preview", prompt: "Choose or enter your answer", answer: "Your answer", choose: "Try the controls", demo: "Interactive demo · not scored", audio: "Play German audio", playing: "Audio preview played", reveal: "Reveal meaning", revealed: "to come", selected: "Selected", written: "Entered", tokens: ["Ich","lerne","Deutsch."], options: ["Guten Tag!","Gute Nacht!","Auf Wiedersehen!"], inputHint: "Type an answer" },
  ru: { title: "Форматы упражнений", lead: "Посмотрите все 35 форматов плеера. Откройте формат, чтобы увидеть пример взаимодействия.", search: "Найти формат", count: "В уроках: {count}", empty: "По этому запросу форматы не найдены.", practice: "Перейти к практике", preview: "Показать пример", close: "Закрыть пример", prompt: "Выберите или введите ответ", answer: "Ваш ответ", choose: "Попробуйте элементы", demo: "Интерактивный пример · без оценки", audio: "Воспроизвести немецкую речь", playing: "Аудио воспроизведено", reveal: "Показать значение", revealed: "приходить", selected: "Выбрано", written: "Введено", tokens: ["Ich","lerne","Deutsch."], options: ["Guten Tag!","Gute Nacht!","Auf Wiedersehen!"], inputHint: "Введите ответ" },
  uk: { title: "Формати вправ", lead: "Перегляньте всі 35 форматів плеєра. Відкрийте формат, щоб побачити приклад взаємодії.", search: "Знайти формат", count: "В уроках: {count}", empty: "За цим запитом форматів не знайдено.", practice: "Перейти до практики", preview: "Показати приклад", close: "Закрити приклад", prompt: "Оберіть або введіть відповідь", answer: "Ваша відповідь", choose: "Спробуйте елементи", demo: "Інтерактивний приклад · без оцінювання", audio: "Відтворити німецьке аудіо", playing: "Аудіо відтворено", reveal: "Показати значення", revealed: "приходити", selected: "Обрано", written: "Введено", tokens: ["Ich","lerne","Deutsch."], options: ["Guten Tag!","Gute Nacht!","Auf Wiedersehen!"], inputHint: "Введіть відповідь" },
  ar: { title: "أنماط التمارين", lead: "استكشف أنماط الإجابة الـ 35. افتح أي نمط لمعاينة طريقة التفاعل معه.", search: "ابحث عن نمط", count: "في الدروس: {count}", empty: "لا توجد أنماط تطابق البحث.", practice: "انتقل إلى التدريب", preview: "معاينة التفاعل", close: "إغلاق المعاينة", prompt: "اختر إجابة أو اكتبها", answer: "إجابتك", choose: "جرّب عناصر التفاعل", demo: "عرض تفاعلي · بلا تقييم", audio: "تشغيل الصوت الألماني", playing: "تم تشغيل معاينة الصوت", reveal: "أظهر المعنى", revealed: "يأتي", selected: "المحدد", written: "المدخل", tokens: ["Ich","lerne","Deutsch."], options: ["Guten Tag!","Gute Nacht!","Auf Wiedersehen!"], inputHint: "اكتب إجابة" },
};

const FORMATS = ["single_choice", "true_false", "match_pairs", "categorize", "listening_choice", "dictation", "error_correction", "reply_choice", "article_input", "form_input", "gap_fill_input", "spelling_input", "number_input", "time_input", "multi_choice", "word_order", "cloze", "transform", "minimal_pairs", "keyword_build", "token_bank_build", "verb_position", "negation", "connector_choice", "case_choice", "preposition_choice", "separable_verb", "read_question", "dialogue_gap", "modal_choice", "odd_one_out", "flashcard_recall", "translation_input", "join_halves", "stress_mark"] as const;
type Format = typeof FORMATS[number];

const LABELS: Record<string, Partial<Record<Format, string>>> = {
  ru: { single_choice:"Выбрать один ответ",true_false:"Верно или неверно",match_pairs:"Составить пары",categorize:"Распределить по категориям",listening_choice:"Ответить по аудио",dictation:"Диктант",error_correction:"Исправить ошибку",reply_choice:"Выбрать ответ в диалоге",article_input:"Вписать артикль",form_input:"Ввести форму слова",gap_fill_input:"Заполнить пропуск",spelling_input:"Написать слово",number_input:"Ввести число",time_input:"Записать время",multi_choice:"Выбрать несколько ответов",word_order:"Собрать порядок слов",cloze:"Заполнить текст",transform:"Преобразовать фразу",minimal_pairs:"Различить звучание",keyword_build:"Собрать фразу по опорам",token_bank_build:"Собрать фразу из слов",verb_position:"Определить место глагола",negation:"Выбрать отрицание",connector_choice:"Выбрать союз",case_choice:"Выбрать падеж",preposition_choice:"Выбрать предлог",separable_verb:"Разделяемый глагол",read_question:"Ответить по тексту",dialogue_gap:"Заполнить реплику",modal_choice:"Выбрать модальный глагол",odd_one_out:"Найти лишнее",flashcard_recall:"Вспомнить значение",translation_input:"Перевести предложение",join_halves:"Соединить части",stress_mark:"Отметить ударный слог" },
  uk: { single_choice:"Обрати одну відповідь",true_false:"Правда чи неправда",match_pairs:"Утвори пари",categorize:"Розподіли за категоріями",listening_choice:"Відповідай на слух",dictation:"Диктант",error_correction:"Виправ помилку",reply_choice:"Обери відповідь у діалозі",article_input:"Впиши артикль",form_input:"Введи форму слова",gap_fill_input:"Заповни пропуск",spelling_input:"Напиши слово",number_input:"Введи число",time_input:"Запиши час",multi_choice:"Обери кілька відповідей",word_order:"Склади порядок слів",cloze:"Заповни текст",transform:"Перетвори фразу",minimal_pairs:"Розрізни звучання",keyword_build:"Склади фразу за підказками",token_bank_build:"Склади фразу зі слів",verb_position:"Визнач місце дієслова",negation:"Обери заперечення",connector_choice:"Обери сполучник",case_choice:"Обери відмінок",preposition_choice:"Обери прийменник",separable_verb:"Дієслово з відокремлюваною часткою",read_question:"Дай відповідь за текстом",dialogue_gap:"Заповни репліку",modal_choice:"Обери модальне дієслово",odd_one_out:"Знайди зайве",flashcard_recall:"Згадай значення",translation_input:"Переклади речення",join_halves:"З’єднай частини",stress_mark:"Познач наголошений склад" },
  ar: { single_choice:"اختر إجابة واحدة",true_false:"صحيح أم خطأ",match_pairs:"طابق الأزواج",categorize:"صنّف العناصر",listening_choice:"أجب بعد الاستماع",dictation:"إملاء",error_correction:"صحّح الخطأ",reply_choice:"اختر ردًا في الحوار",article_input:"أدخل أداة التعريف",form_input:"أدخل صيغة الكلمة",gap_fill_input:"أكمل الفراغ",spelling_input:"اكتب الكلمة",number_input:"أدخل الرقم",time_input:"اكتب الوقت",multi_choice:"اختر عدة إجابات",word_order:"رتّب الكلمات",cloze:"أكمل النص",transform:"حوّل الجملة",minimal_pairs:"ميّز بين الصوتين",keyword_build:"كوّن جملة من التلميحات",token_bank_build:"كوّن جملة من الكلمات",verb_position:"حدّد موقع الفعل",negation:"اختر النفي",connector_choice:"اختر أداة الربط",case_choice:"اختر الحالة الإعرابية",preposition_choice:"اختر حرف الجر",separable_verb:"الفعل القابل للانفصال",read_question:"أجب عن النص",dialogue_gap:"أكمل الحوار",modal_choice:"اختر الفعل الناقص",odd_one_out:"حدّد العنصر المختلف",flashcard_recall:"تذكّر المعنى",translation_input:"ترجم الجملة",join_halves:"صِل بين الجزأين",stress_mark:"حدّد المقطع المنبور" },
};

function FormatPreview({ format, copy, label }: { format: Format; copy: CatalogCopy; label: string }) {
  const [selected, setSelected] = useState("");
  const [text, setText] = useState("");
  const [playing, setPlaying] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const multi = format === "multi_choice" || format === "categorize";
  const audio = format === "listening_choice" || format === "minimal_pairs" || format === "dictation";
  const recall = format === "flashcard_recall";
  const stress = format === "stress_mark";
  const pairing = format === "match_pairs" || format === "join_halves";
  const tokens = copy.tokens;
  const options = format === "true_false" ? ["Richtig", "Falsch"] : format === "article_input" ? ["der", "die", "das"] : format === "listening_choice" || format === "minimal_pairs" ? ["ich", "ach"] : format === "verb_position" ? ["Position 1", "Position 2", "Am Ende"] : format === "odd_one_out" ? ["Apfel", "Birne", "laufen"] : copy.options;
  const input = ["dictation","error_correction","form_input","gap_fill_input","spelling_input","number_input","time_input","translation_input","cloze","transform","dialogue_gap"].includes(format);
  function choose(value: string) { setSelected(current => multi ? current.includes(value) ? current.replace(value, "").trim() : `${current} ${value}`.trim() : value); }
  return <div className="format-preview" aria-label={label}>
    <div className="format-preview-head"><strong>{label}</strong><span className="tag">{copy.demo}</span></div>
    <p className="format-preview-prompt" lang="de">{format === "listening_choice" || format === "minimal_pairs" || format === "dictation" ? "Hör genau hin." : format === "flashcard_recall" ? "kommen" : format === "read_question" ? "Mila kommt am Morgen zum Bahnhof." : format === "error_correction" ? "Ich gehen heute nach Hause." : format === "stress_mark" ? "Ba · na · ne" : format === "separable_verb" ? "Ich ___ um sieben Uhr auf." : "Ich ___ Deutsch."}</p>
    <p className="muted small">{copy.prompt}</p>
    {audio && <button type="button" className="button secondary" onClick={() => setPlaying(true)}>{playing ? `✓ ${copy.playing}` : `🔊 ${copy.audio}`}</button>}
    {recall ? <div className="format-preview-recall"><button type="button" className="format-preview-options" onClick={()=>setRevealed(!revealed)}>{copy.reveal}</button>{revealed&&<strong lang="de">{copy.revealed}</strong>}</div> : stress ? <div className="format-preview-options">{tokens.map((part,i)=><button type="button" aria-pressed={selected===String(i)} className={selected===String(i)?"selected":""} key={part+i} onClick={()=>setSelected(String(i))}>{part}</button>)}</div> : input ? <label className="format-preview-input"><span>{copy.answer}</span><input value={text} onChange={e=>setText(e.target.value)} placeholder={format === "number_input" ? "20" : format === "time_input" ? "08:30" : copy.inputHint} /></label> : pairing ? <div className="format-preview-options">{["Guten Morgen ↔ Good morning", "der Bahnhof ↔ train station"].map(v=><button type="button" aria-pressed={selected===v} className={selected===v?"selected":""} key={v} onClick={()=>choose(v)}>{v}</button>)}</div> : ["word_order","keyword_build","token_bank_build","separable_verb","verb_position"].includes(format) ? <div className="format-preview-tokens">{tokens.map(token=><button type="button" aria-pressed={selected.includes(token)} className={selected.includes(token)?"selected":""} key={token} onClick={()=>choose(token)}>{token}</button>)}</div> : <div className="format-preview-options">{options.map(option=><button type="button" aria-pressed={selected.includes(option)} className={selected.includes(option)?"selected":""} key={option} onClick={()=>choose(option)}>{option}</button>)}</div>}
    <p className="muted small" aria-live="polite">{selected ? `${copy.selected}: ${selected}` : text ? `${copy.written}: ${text}` : copy.choose}</p>
  </div>;
}

export function ExerciseCatalog({ lang, counts }: { lang: string; counts: Record<string, number> }) {
  const copy = COPY[lang] ?? COPY.en!;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Format | null>(null);
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(lang);
    return FORMATS.filter(format => format.replaceAll("_", " ").toLocaleLowerCase(lang).includes(needle) || (LABELS[lang]?.[format] ?? format).toLocaleLowerCase(lang).includes(needle));
  }, [lang, query]);
  return <main className="page exercise-catalog">
    <p className="eyebrow">DeutschGo</p><h1>{copy.title}</h1><p className="lead">{copy.lead}</p>
    <label className="catalog-search"><span>{copy.search}</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} /></label>
    <p className="muted small" aria-live="polite"><bdi dir="ltr">{visible.length} / {FORMATS.length}</bdi></p>
    {visible.length ? <ul className="catalog-grid">{visible.map(format=>{
      const label=LABELS[lang]?.[format] ?? format.replaceAll("_"," ");
      const expanded=open===format;
      return <li className={`card catalog-format${expanded?" is-expanded":""}`} key={format}>
        <span className="catalog-format-icon" aria-hidden="true">✳</span><h2 lang={lang==="ar"?"ar":undefined}>{label}</h2>
        <p className="muted small">{copy.count.replace("{count}",String(counts[format]??0))}</p>
        <button className="format-preview-toggle" type="button" aria-expanded={expanded} onClick={()=>setOpen(expanded?null:format)}>{expanded?copy.close:copy.preview}</button>
        {expanded&&<FormatPreview key={format} format={format} copy={copy} label={label} />}
      </li>;
    })}</ul> : <p className="card muted">{copy.empty}</p>}
    <Link className="btn btn-secondary" href={`/${lang}/practice`}>{copy.practice}</Link>
  </main>;
}
