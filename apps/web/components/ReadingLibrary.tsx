"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { translator } from "@deutschgo/i18n";
import { gradeWord, listSavedWords, removeWord, saveWord, type SavedWord } from "../lib/vocabulary";

export interface ReadingToken { de: string; lemma?: string; gloss?: Record<string, string> }
export interface ReadingStory {
  id: string; level: string; minutes: number; title: string; summary: string; source: string;
  concepts: string[]; paragraphs: ReadingToken[][];
}

function sentence(tokens: ReadingToken[]): string {
  return tokens.reduce((value, token, index) => {
    const closes = /^[.,?!:;»”’)]/.test(token.de);
    const followsOpen = index > 0 && /^[«„“(]$/.test(tokens[index - 1]!.de);
    return `${value}${index > 0 && !closes && !followsOpen ? " " : ""}${token.de}`;
  }, "");
}

export function LibraryBoard({ lang, stories }: { lang: string; stories: ReadingStory[] }) {
  const msg = translator(lang);
  const [saved, setSaved] = useState<SavedWord[]>([]);
  useEffect(() => setSaved(listSavedWords()), []);
  const due = saved.filter((word) => word.dueAt <= Date.now()).length;
  return <main className="page library-page">
    <header className="library-heading"><div><p className="eyebrow">{msg("library.eyebrow")}</p><h1>{msg("library.title")}</h1><p className="lead">{msg("library.lead")}</p></div>
      <div className="library-actions"><Link className="btn btn-secondary" href={`/${lang}/dictionary`}>{msg("dictionary.open")}</Link><Link className="btn btn-secondary" href={`/${lang}/vocabulary`}>{msg("library.words", { count: saved.length })}{due > 0 ? ` · ${msg("library.due", { count: due })}` : ""}</Link></div>
    </header>
    <section className="library-grid" aria-label={msg("library.readings")}>
      {stories.map((story, index) => <article className={`reading-card reading-card-${index % 3}`} key={story.id}>
        <div className="reading-art" aria-hidden="true"><span>{index === 0 ? "07:42" : "A1"}</span><span>{index === 0 ? "↗" : "⌁"}</span></div>
        <div className="reading-card-body"><div className="reading-meta"><span>{story.level}</span><span>{msg("library.minutes", { minutes: story.minutes })}</span></div><h2>{story.title}</h2><p className="muted">{story.summary}</p>
          <Link className="btn btn-primary" href={`/${lang}/library/${story.id}`}>{msg("library.open")}</Link></div>
      </article>)}
      {stories.length === 0 && <section className="card review-empty"><h2>{msg("library.empty")}</h2></section>}
    </section>
    <p className="library-source muted small">{msg("library.originalNote")}</p>
  </main>;
}

export function ReadingArticle({ lang, story }: { lang: string; story: ReadingStory }) {
  const msg = translator(lang);
  const [selected, setSelected] = useState<{ token: ReadingToken; id: string; context: string } | null>(null);
  const [saved, setSaved] = useState<SavedWord[]>([]);
  const [notice, setNotice] = useState("");
  useEffect(() => setSaved(listSavedWords()), []);
  const savedIds = useMemo(() => new Set(saved.map((word) => word.id)), [saved]);
  return <main className="page reading-page">
    <Link className="back-link" href={`/${lang}/library`}>← {msg("library.back")}</Link>
    <header className="reading-title"><p className="eyebrow">{story.level} · {msg("library.minutes", { minutes: story.minutes })}</p><h1>{story.title}</h1><p className="lead">{story.summary}</p></header>
    <div className="reading-layout"><article className="reading-text" lang="de">
      {story.paragraphs.map((paragraph, pi) => {
        const context = sentence(paragraph);
        return <p key={pi}>{paragraph.map((token, ti) => {
          const id = `${story.id}:${pi}:${ti}`;
          const closes = /^[.,?!:;»”’)]/.test(token.de);
          const followsOpen = ti > 0 && /^[«„“(]$/.test(paragraph[ti - 1]!.de);
          return <span key={id}>{ti > 0 && !closes && !followsOpen ? " " : ""}{token.lemma ? <button type="button" className={`word-token${savedIds.has(id) ? " is-saved" : ""}`} onClick={() => { setSelected({ token, id, context }); setNotice(""); }} aria-label={msg("library.lookupWord", { word: token.de })}>{token.de}</button> : token.de}</span>;
        })}</p>;
      })}
      <p className="reading-source">{msg("library.sourceLabel")}: {story.source}</p>
    </article>
    <aside className="reading-aside">
        {selected ? <section className="card lookup-card" aria-live="polite">
        <p className="eyebrow">{msg("library.wordInContext")}</p><h2 lang="de" className="de">{selected.token.de}</h2>
        <p className="lookup-lemma" lang="de">{selected.token.lemma}</p><p>{selected.token.gloss?.[lang] ?? selected.token.gloss?.en ?? msg("library.noMeaning")}</p>
        <blockquote lang="de" className="de">{selected.context}</blockquote>
        {savedIds.has(selected.id) ? <p className="saved-confirmation">✓ {msg("library.alreadySaved")}</p> : <button className="btn btn-primary" type="button" onClick={() => {
          const ok = saveWord({ id: selected.id, storyId: story.id, word: selected.token.de, lemma: selected.token.lemma ?? selected.token.de, meaning: selected.token.gloss?.[lang] ?? selected.token.gloss?.en ?? "", context: selected.context });
          setSaved(listSavedWords()); setNotice(msg(ok ? "library.saved" : "library.saveFailed"));
        }}>{msg("library.saveWord")}</button>}
        <Link className="text-link" href={`/${lang}/dictionary?q=${encodeURIComponent(selected.token.lemma ?? selected.token.de)}`}>{msg("dictionary.open")}</Link>
        {notice && <p role="status" className="small muted">{notice}</p>}
      </section> : <section className="card lookup-hint"><span className="lookup-mark" aria-hidden="true">Aa</span><h2>{msg("library.lookupTitle")}</h2><p className="muted">{msg("library.lookupHint")}</p></section>}
      <section className="card reading-progress"><strong>{saved.length}</strong><p>{msg("library.savedCount", { count: saved.length })}</p><Link href={`/${lang}/vocabulary`}>{msg("library.openWords")}</Link></section>
    </aside></div>
  </main>;
}

export function VocabularyBoard({ lang, stories }: { lang: string; stories: { id: string; title: string }[] }) {
  const msg = translator(lang);
  const [items, setItems] = useState<SavedWord[]>([]);
  const [reviewed, setReviewed] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => setItems(listSavedWords()), []);
  const now = Date.now();
  const due = items.filter((item) => item.dueAt <= now);
  const current = due[0];
  const storyTitles = new Map(stories.map((story) => [story.id, story.title]));
  const next = (remembered: boolean) => {
    if (!current) return;
    const ok = gradeWord(current.id, remembered);
    setItems(listSavedWords()); setReviewed((value) => value + 1); setRevealed(false); setNotice(msg(ok ? (remembered ? "library.remembered" : "library.again") : "library.saveFailed"));
  };
  return <main className="page vocabulary-page">
    <header className="library-heading"><div><p className="eyebrow">{msg("library.eyebrow")}</p><h1>{msg("library.vocabulary")}</h1><p className="lead">{msg("library.vocabularyLead")}</p></div><Link className="review-back" href={`/${lang}/library`}>← {msg("library.backToLibrary")}</Link></header>
    <section className="vocab-summary"><div><strong>{items.length}</strong><span>{msg("library.totalWords")}</span></div><div><strong>{due.length}</strong><span>{msg("library.dueWords")}</span></div><div><strong>{items.length - due.length}</strong><span>{msg("library.learning")}</span></div></section>
    {!items.length ? <section className="card review-empty"><span className="lookup-mark" aria-hidden="true">＋</span><h2>{msg("library.noWords")}</h2><p className="muted">{msg("library.noWordsBody")}</p><Link className="btn btn-primary" href={`/${lang}/library`}>{msg("library.browse")}</Link></section> : due.length === 0 ? <section className="card review-empty"><span className="review-check" aria-hidden="true">✓</span><h2>{msg("library.noDue")}</h2><p className="muted">{msg("library.noDueBody")}</p><Link className="btn btn-primary" href={`/${lang}/library`}>{msg("library.browse")}</Link></section> : current ? <section className="vocab-session">
      <p className="vocab-count">{msg("library.cardCount", { current: reviewed + 1, total: reviewed + due.length })}</p><article className="card vocab-card"><p className="eyebrow">{current.lemma}</p><h2 lang="de" className="de">{current.word}</h2>
        {revealed ? <div className="vocab-answer"><p className="vocab-meaning">{current.meaning}</p><blockquote lang="de" className="de">{current.context}</blockquote><p className="muted small">{msg("library.fromStory", { title: storyTitles.get(current.storyId) ?? current.storyId })}</p></div> : <p className="muted">{msg("library.recallPrompt")}</p>}
        {!revealed ? <button className="btn btn-primary" type="button" onClick={() => setRevealed(true)}>{msg("library.showAnswer")}</button> : <div className="vocab-actions"><button className="btn btn-secondary" type="button" onClick={() => next(false)}>{msg("library.againButton")}</button><button className="btn btn-primary" type="button" onClick={() => next(true)}>{msg("library.knownButton")}</button></div>}
      </article>{notice && <p role="status" className="small muted">{notice}</p>}
    </section> : null}
    {items.length > 0 && <section className="saved-word-list"><h2>{msg("library.allSaved")}</h2><ul>{items.map((item) => <li key={item.id}><div><strong className="de" lang="de">{item.word}</strong><span className="muted small">{item.meaning} · {storyTitles.get(item.storyId) ?? item.storyId}</span></div><span className="word-due">{item.dueAt <= now ? msg("library.dueTag") : new Date(item.dueAt).toLocaleDateString(lang)}</span><button className="text-button" type="button" onClick={() => { removeWord(item.id); setItems(listSavedWords()); }}>{msg("library.remove")}</button></li>)}</ul></section>}
    <p className="library-source muted small">{msg("library.deviceNote")}</p>
  </main>;
}
