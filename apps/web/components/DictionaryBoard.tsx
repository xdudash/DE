"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { translator } from "@deutschgo/i18n";
import { listSavedWords, saveWord } from "../lib/vocabulary";

export interface DictionaryEntry {
  id: string;
  storyId: string;
  storyTitle: string;
  level: string;
  word: string;
  lemma: string;
  meaning: string;
  context: string;
}

export function DictionaryBoard({ lang, entries, initialQuery }: { lang: string; entries: DictionaryEntry[]; initialQuery: string }) {
  const msg = translator(lang);
  const [query, setQuery] = useState(initialQuery);
  const [selectedId, setSelectedId] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [notice, setNotice] = useState("");
  useEffect(() => setSavedIds(new Set(listSavedWords().map((word) => word.id))), []);
  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("de");
    const matching = q ? entries.filter((entry) => [entry.word, entry.lemma, entry.meaning].some((part) => part.toLocaleLowerCase(lang).includes(q))) : entries;
    return matching.slice(0, 60);
  }, [entries, query, lang]);
  const selected = visible.find((entry) => entry.id === selectedId) ?? visible[0];

  function save(entry: DictionaryEntry) {
    const ok = saveWord({ id: entry.id, storyId: entry.storyId, word: entry.word, lemma: entry.lemma, meaning: entry.meaning, context: entry.context });
    if (ok) setSavedIds((previous) => new Set(previous).add(entry.id));
    setNotice(msg(ok ? "dictionary.saved" : "library.saveFailed"));
  }

  return <main className="page dictionary-page">
    <header className="library-heading"><div><p className="eyebrow">{msg("dictionary.eyebrow")}</p><h1>{msg("dictionary.title")}</h1><p className="lead">{msg("dictionary.lead")}</p></div><Link className="review-back" href={`/${lang}/library`}>← {msg("dictionary.back")}</Link></header>
    <label className="dictionary-search"><span>{msg("dictionary.search")}</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setSelectedId(""); setNotice(""); }} autoComplete="off" /></label>
    <p className="muted small">{msg("dictionary.sourceNote", { count: visible.length })}</p>
    <div className="dictionary-layout">
      <section className="dictionary-results" aria-label={msg("dictionary.results")}>
        {visible.map((entry) => <button key={entry.id} type="button" className={`dictionary-result${selected?.id === entry.id ? " selected" : ""}`} onClick={() => { setSelectedId(entry.id); setNotice(""); }}>
          <span><strong lang="de">{entry.lemma}</strong><small>{entry.meaning}</small></span><span className="tag">{entry.level}</span>
        </button>)}
        {visible.length === 0 && <section className="card review-empty"><h2>{msg("dictionary.empty")}</h2><p className="muted">{msg("dictionary.emptyBody")}</p></section>}
        {visible.length === 60 && <p className="muted small">{msg("dictionary.refine")}</p>}
      </section>
      {selected && <aside className="card dictionary-detail" aria-live="polite">
        <span className="tag">{selected.level}</span><p className="eyebrow">{msg("dictionary.entry")}</p><h2 className="de" lang="de">{selected.lemma}</h2><p className="dictionary-meaning">{selected.meaning}</p>
        {selected.word !== selected.lemma && <p className="muted small">{msg("dictionary.seenAs")} <span className="de" lang="de">{selected.word}</span></p>}
        <div className="divider" /><h3>{msg("dictionary.example")}</h3><blockquote className="de" lang="de">{selected.context}</blockquote>
        <p className="muted small">{msg("dictionary.fromStory", { title: selected.storyTitle })}</p>
        {savedIds.has(selected.id) ? <p className="saved-confirmation" role="status">✓ {msg("dictionary.savedAlready")}</p> : <button className="btn btn-primary" type="button" onClick={() => save(selected)}>{msg("dictionary.save")}</button>}
        {notice && <p role="status" className="small muted">{notice}</p>}
        <Link className="text-link" href={`/${lang}/library/${selected.storyId}`}>{msg("dictionary.openStory")}</Link>
      </aside>}
    </div>
    <p className="library-source muted small">{msg("dictionary.localNote")}</p>
  </main>;
}
