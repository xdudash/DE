"use client";

import { useEffect, useState } from "react";

export interface WritingPrompt {
  id: string;
  title: string;
  level: string;
  situation: string;
  tasks: string[];
  image?: { src: string; alt: string };
}

interface WritingLabels {
  noGrade: string; localOnly: string; choosePrompt: string; draftStarted: string; draftEmpty: string;
  situation: string; tasks: string; answer: string; wordCount: string; placeholder: string;
  selfReview: string; markReviewed: string; reviewed: string; reset: string; saved: string; saveError: string;
}

interface Props {
  lang: string;
  labels: WritingLabels;
  prompts: WritingPrompt[];
  criteria: string[];
}

type SavedWorkshop = {
  drafts: Record<string, string>;
  checks: Record<string, boolean[]>;
  reviewed: Record<string, boolean>;
};

const EMPTY: SavedWorkshop = { drafts: {}, checks: {}, reviewed: {} };

export function WritingStudio({ lang, labels, prompts, criteria }: Props) {
  const [active, setActive] = useState(0);
  const [work, setWork] = useState<SavedWorkshop>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const prompt = prompts[active] ?? prompts[0];

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`deutschgo-writing-v1:${lang}`);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SavedWorkshop>;
        setWork({
          drafts: parsed.drafts && typeof parsed.drafts === "object" ? parsed.drafts : {},
          checks: parsed.checks && typeof parsed.checks === "object" ? parsed.checks : {},
          reviewed: parsed.reviewed && typeof parsed.reviewed === "object" ? parsed.reviewed : {},
        });
      }
    } catch {
      setSaveError(true);
    } finally {
      setHydrated(true);
    }
  }, [lang]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(`deutschgo-writing-v1:${lang}`, JSON.stringify(work));
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [hydrated, lang, work]);

  if (!prompt) return null;
  const promptId = prompt.id;
  const draft = work.drafts[promptId] ?? "";
  const checked = work.checks[promptId] ?? criteria.map(() => false);
  const wordCount = draft.trim() ? draft.trim().split(/\s+/u).length : 0;
  const allChecked = criteria.length > 0 && criteria.every((_, i) => checked[i]);

  function updateDraft(value: string) {
    setWork((current) => ({
      ...current,
      drafts: { ...current.drafts, [promptId]: value },
      checks: { ...current.checks, [promptId]: criteria.map(() => false) },
      reviewed: { ...current.reviewed, [promptId]: false },
    }));
  }

  function toggleCriterion(index: number) {
    const next = [...checked];
    next[index] = !next[index];
    setWork((current) => ({ ...current, checks: { ...current.checks, [promptId]: next }, reviewed: { ...current.reviewed, [promptId]: false } }));
  }

  function clearDraft() {
    setWork((current) => ({
      drafts: { ...current.drafts, [promptId]: "" },
      checks: { ...current.checks, [promptId]: criteria.map(() => false) },
      reviewed: { ...current.reviewed, [promptId]: false },
    }));
  }

  return (
    <section className="writing-studio" aria-busy={!hydrated}>
      <div className="writing-notes">
        <span className="pill">{labels.noGrade}</span>
        <p className="muted small">{labels.localOnly}</p>
      </div>
      <div className="writing-layout">
        <nav className="writing-prompts" aria-label={labels.choosePrompt}>
          <h2>{labels.choosePrompt}</h2>
          {prompts.map((item, index) => (
            <button key={item.id} type="button" className={index === active ? "writing-prompt active" : "writing-prompt"} aria-pressed={index === active} disabled={!hydrated} onClick={() => setActive(index)}>
              <span className="pill">{item.level}</span>
              <strong>{item.title}</strong>
              <span className="muted small">{work.drafts[item.id]?.trim() ? labels.draftStarted : labels.draftEmpty}</span>
            </button>
          ))}
        </nav>
        <div className="writing-workspace">
          <article className="card writing-brief">
            <span className="pill blue">{labels.situation}</span>
            <h2>{prompt.title}</h2>
            {prompt.image && (
              <figure className="writing-picture">
                <img src={prompt.image.src} alt={prompt.image.alt} />
              </figure>
            )}
            <p>{prompt.situation}</p>
            <h3>{labels.tasks}</h3>
            <ul>{prompt.tasks.map((task) => <li key={task}>{task}</li>)}</ul>
          </article>
          <section className="card writing-editor" aria-labelledby="writing-answer-label">
            <div className="writing-editor-heading">
              <label id="writing-answer-label" htmlFor="writing-draft">{labels.answer}</label>
              <span className="pill">{labels.wordCount.replace("{count}", String(wordCount))}</span>
            </div>
            <textarea id="writing-draft" lang="de" value={draft} disabled={!hydrated} onChange={(event) => updateDraft(event.target.value)} placeholder={labels.placeholder} rows={8} />
            <div className="row writing-save-row">
              <span className={saveError ? "banner" : "muted small"} role="status">{saveError ? labels.saveError : labels.saved}</span>
              <button type="button" className="btn" onClick={clearDraft} disabled={!draft && !checked.some(Boolean)}>{labels.reset}</button>
            </div>
          </section>
          <section className="card writing-review">
            <h2 id="writing-self-review-title">{labels.selfReview}</h2>
            <fieldset aria-labelledby="writing-self-review-title" disabled={!draft.trim()}>
              <legend className="sr-only">{labels.selfReview}</legend>
              {criteria.map((criterion, index) => (
                <label key={index} className="writing-check">
                  <input type="checkbox" checked={!!checked[index]} onChange={() => toggleCriterion(index)} />
                  <span>{criterion}</span>
                </label>
              ))}
            </fieldset>
            {work.reviewed[promptId] ? (
              <p className="writing-reviewed" role="status">✓ {labels.reviewed}</p>
            ) : (
              <button type="button" className="btn-primary writing-review-action" disabled={!draft.trim() || !allChecked} onClick={() => setWork((current) => ({ ...current, reviewed: { ...current.reviewed, [promptId]: true } }))}>
                {labels.markReviewed}
              </button>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
