"use client";

import Link from "next/link";
import { useState } from "react";
import { translator, type MessageKey } from "@deutschgo/i18n";
import { writePlacement, type PlacementEstimate } from "../lib/device-state";

const QUESTIONS: { prompt: MessageKey; options: readonly [string, string, string]; correct: number }[] = [
  { prompt: "diagnostic.question1", options: ["Guten Tag!", "Gute Nacht!", "Auf Wiedersehen!"], correct: 0 },
  { prompt: "diagnostic.question2", options: ["Ich wohne Berlin.", "Ich wohne in Berlin.", "Ich in Berlin wohne."], correct: 1 },
  { prompt: "diagnostic.question3", options: ["der Kuchen", "die Kuchen", "das Kuchen"], correct: 0 },
  { prompt: "diagnostic.question4", options: ["Heute gehe ich nach Hause.", "Heute ich gehe nach Hause.", "Heute gehe nach Hause ich."], correct: 0 },
  { prompt: "diagnostic.question5", options: ["Ja, gern.", "Ich bin um acht Uhr.", "Das kostet eine Euro."], correct: 0 },
];

export function PlacementCheck({ lang }: { lang: string }) {
  const msg = translator(lang);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [estimate, setEstimate] = useState<PlacementEstimate | null>(null);
  const [saved, setSaved] = useState(true);
  const question = QUESTIONS[current]!;

  function finish() {
    const correct = QUESTIONS.reduce((sum, item, index) => sum + (answers[index] === item.correct ? 1 : 0), 0);
    const band: PlacementEstimate["band"] = correct <= 2 ? "A0" : correct === 3 ? "A0-A1" : "A1";
    const result: PlacementEstimate = { correct, total: QUESTIONS.length, band, completedAt: Date.now() };
    setEstimate(result);
    setSaved(writePlacement(result));
  }

  function restart() {
    setCurrent(0);
    setAnswers({});
    setEstimate(null);
    setSaved(true);
  }

  if (estimate) {
    const bandKey: MessageKey = estimate.band === "A0" ? "diagnostic.result.a0" : estimate.band === "A1" ? "diagnostic.result.a1" : "diagnostic.result.bridge";
    return <main className="page placement-page">
      <div className="placement-shell card">
        <div className="placement-result-mark" aria-hidden="true">✦</div>
        <p className="eyebrow">{msg("diagnostic.resultKicker")}</p>
        <h1>{msg("diagnostic.resultTitle")}</h1>
        <p className="placement-band" lang="de">{estimate.band === "A0-A1" ? "A0 — A1" : estimate.band}</p>
        <p className="lead">{msg(bandKey)}</p>
        <p className="muted">{msg("diagnostic.score", { correct: estimate.correct, total: estimate.total })}</p>
        <div className="placement-honesty"><strong>{msg("diagnostic.estimateOnly")}</strong><span>{msg("diagnostic.estimateDetail")}</span></div>
        {!saved && <p role="status" className="banner">{msg("diagnostic.notSaved")}</p>}
        <div className="placement-actions">
          <button type="button" className="btn btn-secondary" onClick={restart}>{msg("diagnostic.tryAgain")}</button>
          <Link className="btn btn-primary" href={`/${lang}/start`}>{msg("diagnostic.chooseRoute")}</Link>
        </div>
      </div>
    </main>;
  }

  return <main className="page placement-page">
    <div className="placement-shell card">
      <Link className="placement-back" href={`/${lang}/start`}>← {msg("diagnostic.backToPlan")}</Link>
      <p className="eyebrow">{msg("diagnostic.kicker")}</p>
      <h1>{msg("diagnostic.title")}</h1>
      <p className="muted">{msg("diagnostic.lead")}</p>
      <div className="placement-progress-row"><span>{msg("diagnostic.progress", { current: current + 1, total: QUESTIONS.length })}</span><span>{msg("diagnostic.minutes")}</span></div>
      <div className="route-progress-track placement-progress-track"><i style={{ inlineSize: `${(current + 1) / QUESTIONS.length * 100}%` }} /></div>
      <h2>{msg(question.prompt)}</h2>
      <div className="placement-options" role="group" aria-label={msg(question.prompt)}>
        {question.options.map((option, index) => <button key={option} type="button" className={`placement-option${answers[current] === index ? " selected" : ""}`} aria-pressed={answers[current] === index} onClick={() => setAnswers({ ...answers, [current]: index })}>
          <span>{String.fromCharCode(65 + index)}</span><strong lang="de">{option}</strong>
        </button>)}
      </div>
      <div className="placement-actions">
        {current > 0 ? <button type="button" className="btn btn-secondary" onClick={() => setCurrent(current - 1)}>← {msg("diagnostic.previous")}</button> : <span />}
        {current < QUESTIONS.length - 1
          ? <button type="button" className="btn btn-primary" disabled={answers[current] === undefined} onClick={() => setCurrent(current + 1)}>{msg("diagnostic.next")} →</button>
          : <button type="button" className="btn btn-primary" disabled={answers[current] === undefined} onClick={finish}>{msg("diagnostic.finish")} →</button>}
      </div>
      <p className="placement-footnote">{msg("diagnostic.estimateDetail")}</p>
    </div>
  </main>;
}
