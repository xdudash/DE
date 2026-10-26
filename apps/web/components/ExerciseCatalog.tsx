"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type CatalogCopy = { title: string; lead: string; search: string; count: string; empty: string; practice: string; preview: string; close: string; prompt: string; answer: string; choose: string; demo: string; audio: string; playing: string; audioUnavailable: string; reveal: string; removeToken: string; selected: string; written: string; options: string[]; inputHint: string; check: string; correct: string; incorrect: string; tryAgain: string; expected: string };
const COPY: Record<string, CatalogCopy> = {
  en: { title: "Exercise formats", lead: "Explore all 35 response formats in the learning player. Open a format to preview how learners interact with it.", search: "Find a format", count: "{count} in lessons", empty: "No formats match this search.", practice: "Go to practice", preview: "Preview interaction", close: "Close preview", prompt: "Choose or enter your answer", answer: "Your answer", choose: "Try the controls", demo: "Interactive demo · not scored", audio: "Play German audio", playing: "Audio preview played", audioUnavailable: "Audio playback is not available in this browser.", reveal: "Reveal meaning", removeToken: "Remove last word", selected: "Selected", written: "Entered", options: ["Guten Tag!","Gute Nacht!","Auf Wiedersehen!"], inputHint: "Type an answer", check: "Check answer", correct: "Correct — nice work!", incorrect: "Not quite.", tryAgain: "Try again", expected: "Expected: {answer}" },
  ru: { title: "Форматы упражнений", lead: "Посмотрите все 35 форматов плеера. Откройте формат, чтобы увидеть пример взаимодействия.", search: "Найти формат", count: "В уроках: {count}", empty: "По этому запросу форматы не найдены.", practice: "Перейти к практике", preview: "Показать пример", close: "Закрыть пример", prompt: "Выберите или введите ответ", answer: "Ваш ответ", choose: "Попробуйте элементы", demo: "Интерактивный пример · без оценки", audio: "Воспроизвести немецкую речь", playing: "Аудио воспроизведено", audioUnavailable: "В этом браузере нет озвучивания.", reveal: "Показать значение", removeToken: "Убрать последнее слово", selected: "Выбрано", written: "Введено", options: ["Guten Tag!","Gute Nacht!","Auf Wiedersehen!"], inputHint: "Введите ответ", check: "Проверить ответ", correct: "Верно, отлично!", incorrect: "Пока не получилось.", tryAgain: "Попробовать ещё", expected: "Правильный ответ: {answer}" },
  uk: { title: "Формати вправ", lead: "Перегляньте всі 35 форматів плеєра. Відкрийте формат, щоб побачити приклад взаємодії.", search: "Знайти формат", count: "В уроках: {count}", empty: "За цим запитом форматів не знайдено.", practice: "Перейти до практики", preview: "Показати приклад", close: "Закрити приклад", prompt: "Оберіть або введіть відповідь", answer: "Ваша відповідь", choose: "Спробуйте елементи", demo: "Інтерактивний приклад · без оцінювання", audio: "Відтворити німецьке аудіо", playing: "Аудіо відтворено", audioUnavailable: "У цьому браузері немає синтезу мовлення.", reveal: "Показати значення", removeToken: "Прибрати останнє слово", selected: "Обрано", written: "Введено", options: ["Guten Tag!","Gute Nacht!","Auf Wiedersehen!"], inputHint: "Введіть відповідь", check: "Перевірити відповідь", correct: "Правильно, чудово!", incorrect: "Не зовсім.", tryAgain: "Спробувати ще", expected: "Правильна відповідь: {answer}" },
  ar: { title: "أنماط التمارين", lead: "استكشف أنماط الإجابة الـ 35. افتح أي نمط لمعاينة طريقة التفاعل معه.", search: "ابحث عن نمط", count: "في الدروس: {count}", empty: "لا توجد أنماط تطابق البحث.", practice: "انتقل إلى التدريب", preview: "معاينة التفاعل", close: "إغلاق المعاينة", prompt: "اختر إجابة أو اكتبها", answer: "إجابتك", choose: "جرّب عناصر التفاعل", demo: "عرض تفاعلي · بلا تقييم", audio: "تشغيل الصوت الألماني", playing: "تم تشغيل معاينة الصوت", audioUnavailable: "تشغيل الصوت غير متاح في هذا المتصفح.", reveal: "أظهر المعنى", removeToken: "إزالة الكلمة الأخيرة", selected: "المحدد", written: "المدخل", options: ["Guten Tag!","Gute Nacht!","Auf Wiedersehen!"], inputHint: "اكتب إجابة", check: "تحقق من الإجابة", correct: "صحيح، أحسنت!", incorrect: "ليست الإجابة الصحيحة بعد.", tryAgain: "حاول مرة أخرى", expected: "الإجابة الصحيحة: {answer}" },
};

const FORMATS = ["single_choice", "true_false", "match_pairs", "categorize", "listening_choice", "dictation", "error_correction", "reply_choice", "article_input", "form_input", "gap_fill_input", "spelling_input", "number_input", "time_input", "multi_choice", "word_order", "cloze", "transform", "minimal_pairs", "keyword_build", "token_bank_build", "verb_position", "negation", "connector_choice", "case_choice", "preposition_choice", "separable_verb", "read_question", "dialogue_gap", "modal_choice", "odd_one_out", "flashcard_recall", "translation_input", "join_halves", "stress_mark"] as const;
type Format = typeof FORMATS[number];

const LABELS: Record<string, Partial<Record<Format, string>>> = {
  ru: { single_choice:"Выбрать один ответ",true_false:"Верно или неверно",match_pairs:"Составить пары",categorize:"Распределить по категориям",listening_choice:"Ответить по аудио",dictation:"Диктант",error_correction:"Исправить ошибку",reply_choice:"Выбрать ответ в диалоге",article_input:"Вписать артикль",form_input:"Ввести форму слова",gap_fill_input:"Заполнить пропуск",spelling_input:"Написать слово",number_input:"Ввести число",time_input:"Записать время",multi_choice:"Выбрать несколько ответов",word_order:"Собрать порядок слов",cloze:"Заполнить текст",transform:"Преобразовать фразу",minimal_pairs:"Различить звучание",keyword_build:"Собрать фразу по опорам",token_bank_build:"Собрать фразу из слов",verb_position:"Определить место глагола",negation:"Выбрать отрицание",connector_choice:"Выбрать союз",case_choice:"Выбрать падеж",preposition_choice:"Выбрать предлог",separable_verb:"Разделяемый глагол",read_question:"Ответить по тексту",dialogue_gap:"Заполнить реплику",modal_choice:"Выбрать модальный глагол",odd_one_out:"Найти лишнее",flashcard_recall:"Вспомнить значение",translation_input:"Перевести предложение",join_halves:"Соединить части",stress_mark:"Отметить ударный слог" },
  uk: { single_choice:"Обрати одну відповідь",true_false:"Правда чи неправда",match_pairs:"Утвори пари",categorize:"Розподіли за категоріями",listening_choice:"Відповідай на слух",dictation:"Диктант",error_correction:"Виправ помилку",reply_choice:"Обери відповідь у діалозі",article_input:"Впиши артикль",form_input:"Введи форму слова",gap_fill_input:"Заповни пропуск",spelling_input:"Напиши слово",number_input:"Введи число",time_input:"Запиши час",multi_choice:"Обери кілька відповідей",word_order:"Склади порядок слів",cloze:"Заповни текст",transform:"Перетвори фразу",minimal_pairs:"Розрізни звучання",keyword_build:"Склади фразу за підказками",token_bank_build:"Склади фразу зі слів",verb_position:"Визнач місце дієслова",negation:"Обери заперечення",connector_choice:"Обери сполучник",case_choice:"Обери відмінок",preposition_choice:"Обери прийменник",separable_verb:"Дієслово з відокремлюваною часткою",read_question:"Дай відповідь за текстом",dialogue_gap:"Заповни репліку",modal_choice:"Обери модальне дієслово",odd_one_out:"Знайди зайве",flashcard_recall:"Згадай значення",translation_input:"Переклади речення",join_halves:"З’єднай частини",stress_mark:"Познач наголошений склад" },
  ar: { single_choice:"اختر إجابة واحدة",true_false:"صحيح أم خطأ",match_pairs:"طابق الأزواج",categorize:"صنّف العناصر",listening_choice:"أجب بعد الاستماع",dictation:"إملاء",error_correction:"صحّح الخطأ",reply_choice:"اختر ردًا في الحوار",article_input:"أدخل أداة التعريف",form_input:"أدخل صيغة الكلمة",gap_fill_input:"أكمل الفراغ",spelling_input:"اكتب الكلمة",number_input:"أدخل الرقم",time_input:"اكتب الوقت",multi_choice:"اختر عدة إجابات",word_order:"رتّب الكلمات",cloze:"أكمل النص",transform:"حوّل الجملة",minimal_pairs:"ميّز بين الصوتين",keyword_build:"كوّن جملة من التلميحات",token_bank_build:"كوّن جملة من الكلمات",verb_position:"حدّد موقع الفعل",negation:"اختر النفي",connector_choice:"اختر أداة الربط",case_choice:"اختر الحالة الإعرابية",preposition_choice:"اختر حرف الجر",separable_verb:"الفعل القابل للانفصال",read_question:"أجب عن النص",dialogue_gap:"أكمل الحوار",modal_choice:"اختر الفعل الناقص",odd_one_out:"حدّد العنصر المختلف",flashcard_recall:"تذكّر المعنى",translation_input:"ترجم الجملة",join_halves:"صِل بين الجزأين",stress_mark:"حدّد المقطع المنبور" },
};

type Demo = {
  prompt: string;
  options?: string[];
  answer: string;
  input?: boolean;
  multi?: boolean;
  tokenOrder?: boolean;
  stress?: boolean;
  pairs?: Array<[string, string]>;
  categories?: string[];
  categoryItems?: Array<{ item: string; category: string }>;
};

const DEMOS: Record<Format, Demo> = {
  single_choice:{prompt:"Ich ___ Deutsch.",options:["lerne","lernst","lernen"],answer:"lerne"},
  true_false:{prompt:"Berlin liegt in Deutschland.",options:["Richtig","Falsch"],answer:"Richtig"},
  match_pairs:{prompt:"Verbinde deutsche Satzteile mit ihrer Fortsetzung.",answer:"Guten Morgen → Good morning; Gute Nacht → Good night",pairs:[["Guten Morgen","Good morning"],["Gute Nacht","Good night"]]},
  categorize:{prompt:"Ordne jedes Wort in die passende Kategorie ein.",answer:"der Apfel → Obst; der Stuhl → Möbel; das Wasser → Getränk",categories:["Obst","Möbel","Getränk"],categoryItems:[{item:"der Apfel",category:"Obst"},{item:"der Stuhl",category:"Möbel"},{item:"das Wasser",category:"Getränk"}]},
  listening_choice:{prompt:"Was hörst du?",options:["der Zug","der Tisch","die Tür"],answer:"der Zug"},
  dictation:{prompt:"Schreibe das gehörte Wort.",answer:"Bahnhof",input:true},
  error_correction:{prompt:"Korrigiere: Ich gehen nach Hause.",answer:"Ich gehe nach Hause.",input:true},
  reply_choice:{prompt:"— Wie geht es dir?",options:["— Gut, danke!","— Ich heiße Anna.","— Um acht Uhr."],answer:"— Gut, danke!"},
  article_input:{prompt:"___ Sonne scheint.",options:["der","die","das"],answer:"die"},
  form_input:{prompt:"Er ___ jeden Tag. (lernen)",answer:"lernt",input:true},
  gap_fill_input:{prompt:"Wir ___ heute Fußball. (spielen)",answer:"spielen",input:true},
  spelling_input:{prompt:"Schreibe das Wort richtig: Wun___ (Wunsch)",answer:"Wunsch",input:true},
  number_input:{prompt:"Wie viel ist zwölf plus acht?",answer:"20",input:true},
  time_input:{prompt:"Schreibe 8:30 auf Deutsch.",answer:"halb neun",input:true},
  multi_choice:{prompt:"Welche Wörter sind Verben?",options:["laufen","blau","schreiben","Tisch"],answer:"laufen|schreiben",multi:true},
  word_order:{prompt:"Ordne die Wörter: Deutsch / Ich / lerne",options:["Deutsch.","lerne","Ich"],answer:"Ich lerne Deutsch.",tokenOrder:true},
  cloze:{prompt:"Mia wohnt ___ Berlin.",answer:"in",input:true},
  transform:{prompt:"Bilde den Plural: das Kind",answer:"die Kinder",input:true},
  minimal_pairs:{prompt:"Welchen Laut hörst du?",options:["ich","ach"],answer:"ich"},
  keyword_build:{prompt:"Bilde einen Satz mit: heute · lernen",options:["heute","Deutsch.","Ich","lerne"],answer:"Ich lerne heute Deutsch.",tokenOrder:true},
  token_bank_build:{prompt:"Baue den Satz aus Wörtern.",options:["nach Berlin.","ich","Morgen","fahre"],answer:"Morgen fahre ich nach Berlin.",tokenOrder:true},
  verb_position:{prompt:"Wo steht das Verb? — Heute lerne ich Deutsch.",options:["Position 1","Position 2","Am Ende"],answer:"Position 2"},
  negation:{prompt:"Ich habe ___ Zeit.",options:["nicht","keine","nein"],answer:"keine"},
  connector_choice:{prompt:"Ich bleibe zu Hause, ___ ich krank bin.",options:["weil","aber","oder"],answer:"weil"},
  case_choice:{prompt:"Ich helfe ___ Mann.",options:["der","dem","den"],answer:"dem"},
  preposition_choice:{prompt:"Wir fahren ___ Berlin.",options:["nach","mit","bei"],answer:"nach"},
  separable_verb:{prompt:"Ich ___ um sieben Uhr ___. (aufstehen)",options:["stehe … auf","aufstehe … —","steht … auf"],answer:"stehe … auf"},
  read_question:{prompt:"Mila kommt am Morgen zum Bahnhof. Wann kommt Mila?",options:["Am Morgen","Am Abend","Am Montag"],answer:"Am Morgen"},
  dialogue_gap:{prompt:"A: Danke schön!  B: ___.",options:["Bitte!","Guten Morgen!","Auf Wiedersehen!"],answer:"Bitte!"},
  modal_choice:{prompt:"Du ___ hier nicht rauchen. (dürfen)",options:["darfst","darf","dürfen"],answer:"darfst"},
  odd_one_out:{prompt:"Welches Wort passt nicht?",options:["Apfel","Birne","laufen"],answer:"laufen"},
  flashcard_recall:{prompt:"Was bedeutet „kommen“?",answer:"to come"},
  translation_input:{prompt:"Übersetze: I learn German.",answer:"Ich lerne Deutsch.",input:true},
  join_halves:{prompt:"Verbinde Satzanfänge und passende Enden.",answer:"Ich lerne → Deutsch.; Ich spiele → Fußball.",pairs:[["Ich lerne","Deutsch."],["Ich spiele","Fußball."]]},
  stress_mark:{prompt:"Welcher Teil ist betont?",options:["Ba","na","ne"],answer:"na",stress:true},
};

function FormatPreview({ format, copy, label }: { format: Format; copy: CatalogCopy; label: string }) {
  const [text, setText] = useState("");
  const [audioStatus, setAudioStatus] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [selected, setSelected] = useState("");
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  const [tokens, setTokens] = useState<string[]>([]);
  const [stress, setStress] = useState("");
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [activePair, setActivePair] = useState("");
  const [categories, setCategories] = useState<Record<string, string>>({});
  const demo = DEMOS[format];
  const audio = format === "listening_choice" || format === "minimal_pairs" || format === "dictation";
  const recall = format === "flashcard_recall";
  const input = demo.input ?? false;
  const normalized = (value: string) => value.trim().toLocaleLowerCase().replace(/[.!?]+$/g, "").replace(/\s+/g, " ");
  const response = input ? text : demo.pairs ? Object.entries(matches).map(([left,right])=>`${left} ${right}`).join("|") : demo.categoryItems ? Object.entries(categories).map(([item,category])=>`${item} ${category}`).join("|") : demo.tokenOrder ? tokens.join(" ") : demo.multi ? multiSelected.join("|") : demo.stress ? stress : selected;
  const matchesCorrect = demo.pairs?.every(([left, right]) => matches[left] === right) ?? true;
  const categoriesCorrect = demo.categoryItems?.every(({ item, category }) => categories[item] === category) ?? true;
  const isCorrect = demo.pairs ? matchesCorrect && Object.keys(matches).length === demo.pairs.length
    : demo.categoryItems ? categoriesCorrect && Object.keys(categories).length === demo.categoryItems.length
      : demo.multi ? [...multiSelected].sort().join("|") === demo.answer.split("|").sort().join("|")
        : demo.tokenOrder ? normalized(response) === normalized(demo.answer)
          : demo.stress ? stress === demo.answer
            : normalized(response) === normalized(demo.answer);
  const canCheck = demo.pairs ? Object.keys(matches).length === demo.pairs.length
    : demo.categoryItems ? demo.categoryItems.every(({item})=>Boolean(categories[item]))
      : Boolean(response.trim());
  function choose(value: string) { setChecked(false); setSelected(value); }
  function reset() { setSelected(""); setText(""); setMultiSelected([]); setTokens([]); setStress(""); setMatches({}); setActivePair(""); setCategories({}); setChecked(false); }
  function playAudio() {
    if (!("speechSynthesis" in window)) { setAudioStatus(copy.audioUnavailable); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(demo.answer);
    utterance.lang = "de-DE";
    utterance.onend = () => setAudioStatus(copy.playing);
    utterance.onerror = () => setAudioStatus(copy.audioUnavailable);
    setAudioStatus(copy.audio);
    window.speechSynthesis.speak(utterance);
  }
  return <div className="format-preview" role="group" aria-label={label}>
    <div className="format-preview-head"><strong>{label}</strong><span className="tag">{copy.demo}</span></div>
    <p className="format-preview-prompt" lang="de">{demo.prompt}</p>
    <p className="muted small">{copy.prompt}</p>
    {audio && <><button type="button" className="button secondary" onClick={playAudio}>🔊 {copy.audio}</button>{audioStatus && <p className="muted small" role="status">{audioStatus}</p>}</>}
    {recall && <div className="format-preview-recall"><button type="button" className="format-preview-toggle" aria-expanded={revealed} onClick={()=>setRevealed(!revealed)}>{copy.reveal}</button>{revealed&&<strong lang="en">{demo.answer}</strong>}</div>}
    {!recall && (demo.pairs ? <div className="format-preview-pair-workspace"><div className="format-preview-pair-list" role="group" aria-label="Satzanfänge">{demo.pairs.map(([left])=><button type="button" key={left} aria-pressed={activePair===left} className={activePair===left?"selected":""} onClick={()=>{setActivePair(left);setChecked(false);}}>{left}</button>)}</div><div className="format-preview-pair-list" role="group" aria-label="Satzenden">{[...demo.pairs.map(([,right])=>right)].reverse().map(right=><button type="button" key={right} aria-pressed={Object.values(matches).includes(right)} className={Object.values(matches).includes(right)?"selected":""} disabled={!activePair} onClick={()=>{if(!activePair)return;setMatches(current=>({...current,[activePair]:right}));setActivePair("");setChecked(false);}}>{right}</button>)}</div><ul className="format-preview-pair-results">{demo.pairs.map(([left])=><li key={left}>{left} <span>→</span> {matches[left] ?? "…"}</li>)}</ul></div>
      : demo.categoryItems ? <div className="format-preview-categories">{demo.categoryItems.map(({item})=><label key={item}><span lang="de">{item}</span><select value={categories[item]??""} onChange={event=>{setCategories(current=>({...current,[item]:event.target.value}));setChecked(false);}}><option value="">—</option>{demo.categories?.map(category=><option key={category} value={category}>{category}</option>)}</select></label>)}</div>
      : demo.tokenOrder ? <div className="format-preview-token-workspace"><div className="format-preview-built" aria-live="polite">{tokens.length ? tokens.join(" ") : "…"}</div><div className="format-preview-tokens">{demo.options?.map(token=><button type="button" key={token} disabled={tokens.includes(token)} onClick={()=>{setTokens(current=>[...current,token]);setChecked(false);}}>{token}</button>)}</div>{tokens.length>0&&<button type="button" className="format-preview-remove" aria-label={copy.removeToken} onClick={()=>{setTokens(current=>current.slice(0,-1));setChecked(false);}}>⌫</button>}</div>
      : demo.multi ? <div className="format-preview-options">{demo.options?.map(option=><button type="button" key={option} aria-pressed={multiSelected.includes(option)} className={multiSelected.includes(option)?"selected":""} onClick={()=>{setMultiSelected(current=>current.includes(option)?current.filter(item=>item!==option):[...current,option]);setChecked(false);}}>{option}</button>)}</div>
      : demo.stress ? <div className="format-preview-options" role="group" aria-label="Silben">{demo.options?.map(syllable=><button type="button" key={syllable} aria-pressed={stress===syllable} className={stress===syllable?"selected":""} onClick={()=>{setStress(syllable);setChecked(false);}}>{syllable}</button>)}</div>
      : input ? <label className="format-preview-input"><span>{copy.answer}</span><input value={text} onChange={e=>{setText(e.target.value);setChecked(false);}} placeholder={format === "number_input" ? "20" : format === "time_input" ? "halb neun" : copy.inputHint} /></label>
      : <div className="format-preview-options">{(demo.options ?? copy.options).map(option=><button type="button" aria-pressed={selected===option} className={selected===option?"selected":""} key={option} onClick={()=>choose(option)}>{option}</button>)}</div>)}
    {!recall && <div className="format-preview-actions"><button type="button" className="button primary" disabled={!canCheck} onClick={()=>setChecked(true)}>{copy.check}</button>{checked && <button type="button" className="button secondary" onClick={reset}>{copy.tryAgain}</button>}</div>}
    {checked && <p className={`format-preview-feedback ${isCorrect ? "is-correct" : "is-incorrect"}`} role="status">{isCorrect ? copy.correct : `${copy.incorrect} ${copy.expected.replace("{answer}", demo.answer)}`}</p>}
    {!checked && !recall && <p className="muted small" aria-live="polite">{response ? `${input ? copy.written : copy.selected}: ${response}` : copy.choose}</p>}
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
