"use client";

/**
 * Interactive exercise. Evaluation uses the same deterministic evaluator as the
 * content validator, so what the author validated is what the learner gets — and the
 * server re-evaluates the same way before storing anything.
 *
 * Saving is opportunistic: feedback never waits for the network, and until sign-in
 * exists the endpoint answers "not signed in", which the page states plainly.
 */
import { useState } from "react";
import { evaluate, type EvaluationResult, type Response } from "@deutschgo/content-kit/evaluate";
import type { Exercise } from "@deutschgo/content-kit/types";
import { submitAttempt, type SubmitState } from "../lib/attempts/submit";
import { recordExerciseResult } from "../lib/device-state";
import { inline } from "../lib/markdown";

export interface PlayerText {
  [key: string]: string;
}

interface Props {
  exercise: Exercise;
  text: PlayerText;
  labels: { check: string; reset: string; tryAgain: string; yourAnswer: string; saveFailed: string; stale: string };
  /** Unit id and version, needed so the server can resolve exactly this exercise. */
  unit: { id: string; version: string };
}

const tr = (text: PlayerText, ref: string | undefined) => (ref ? text[ref.replace(/^@/, "")] ?? ref : "");

export function ExercisePlayer({ exercise, text, labels, unit }: Props) {
  const [save, setSave] = useState<SubmitState>({ status: "off" });
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [choice, setChoice] = useState<string>("");
  const [order, setOrder] = useState<number[]>([]);
  const [gaps, setGaps] = useState<string[]>(() => (exercise.type === "cloze" ? exercise.gaps.map(() => "") : []));
  const [free, setFree] = useState("");
  const [error, setError] = useState<string | null>(null);

  const ready =
    (exercise.type === "single_choice" && choice !== "") ||
    (exercise.type === "word_order" && order.length === exercise.tokens.length) ||
    (exercise.type === "cloze" && gaps.every((g) => g.trim() !== "")) ||
    (exercise.type === "transform" && free.trim() !== "");

  function check() {
    let response: Response;
    switch (exercise.type) {
      case "single_choice": response = { type: "single_choice", optionId: choice }; break;
      case "word_order": response = { type: "word_order", order }; break;
      case "cloze": response = { type: "cloze", gaps }; break;
      case "transform": response = { type: "transform", text: free }; break;
    }
    try {
      const outcome = evaluate(exercise, response);
      setResult(outcome);
      setError(null);
      // Latest answer per exercise, kept in this browser for the lesson summary.
      recordExerciseResult(unit.id, exercise.id, outcome.correct);
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    // One id per answer: a retry of the same answer must not count twice.
    const eventId = crypto.randomUUID();
    setSave({ status: "saving" });
    void submitAttempt({
      eventId,
      unitId: unit.id,
      exerciseId: exercise.id,
      contentVersion: unit.version,
      response,
    }).then(setSave, () => setSave({ status: "failed", reason: "unexpected" }));
  }

  function reset() {
    setResult(null); setChoice(""); setOrder([]); setFree(""); setError(null); setSave({ status: "off" });
    if (exercise.type === "cloze") setGaps(exercise.gaps.map(() => ""));
  }

  const locked = result?.correct === true;

  return (
    <section className="exercise" aria-labelledby={`${exercise.id}-prompt`}>
      <p id={`${exercise.id}-prompt`} className="prompt">{inline(tr(text, exercise.prompt))}</p>

      {exercise.type === "single_choice" && (
        <>
          {exercise.stem_de && <p lang="de" className="de stem">{exercise.stem_de}</p>}
          <fieldset className="options" disabled={locked}>
            <legend className="sr-only">{tr(text, exercise.prompt)}</legend>
            {exercise.options.map((o) => (
              <label key={o.id} className={`option ${choice === o.id ? "selected" : ""}`}>
                <input type="radio" name={exercise.id} value={o.id} checked={choice === o.id} onChange={() => { setChoice(o.id); setResult(null); }} />
                <span lang={o.de ? "de" : undefined}>{o.de ?? tr(text, o.text)}</span>
              </label>
            ))}
          </fieldset>
        </>
      )}

      {exercise.type === "word_order" && (
        <>
          <div className="built" aria-live="polite" aria-label={labels.yourAnswer} lang="de">
            {order.length ? order.map((i) => exercise.tokens[i]).join(" ") + (order.length === exercise.tokens.length ? exercise.final_punctuation : " …") : "…"}
          </div>
          <div className="tokens">
            {exercise.tokens.map((tok, i) => (
              <button key={i} type="button" lang="de" className="token" disabled={locked || order.includes(i)} onClick={() => { setOrder([...order, i]); setResult(null); }}>
                {tok}
              </button>
            ))}
          </div>
        </>
      )}

      {exercise.type === "cloze" && (
        <p lang="de" className="de cloze">
          {exercise.text_de.split(/(\{\{\d+\}\})/).map((part, i) => {
            const m = /^\{\{(\d+)\}\}$/.exec(part);
            if (!m) return <span key={i}>{part}</span>;
            const gi = Number(m[1]);
            const gr = result?.gaps?.[gi];
            return (
              <input
                key={i}
                className={`gap ${gr ? (gr.correct ? "ok" : "bad") : ""}`}
                aria-label={`${labels.yourAnswer} ${gi + 1}`}
                value={gaps[gi] ?? ""}
                disabled={locked}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                onChange={(e) => { const g = [...gaps]; g[gi] = e.target.value; setGaps(g); setResult(null); }}
              />
            );
          })}
        </p>
      )}

      {exercise.type === "transform" && (
        <>
          <p lang="de" className="de stem">{exercise.source_de}</p>
          <input
            className="free"
            lang="de"
            aria-label={labels.yourAnswer}
            value={free}
            disabled={locked}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => { setFree(e.target.value); setResult(null); }}
            onKeyDown={(e) => { if (e.key === "Enter" && ready) check(); }}
          />
        </>
      )}

      <div className="actions">
        <button type="button" className="primary" onClick={check} disabled={!ready || locked}>{labels.check}</button>
        <button type="button" onClick={reset}>{result && !result.correct ? labels.tryAgain : labels.reset}</button>
      </div>

      {error && <p role="alert" className="feedback bad">{error}</p>}
      {result && (
        <div role="status" className={`feedback ${result.correct ? "ok" : "bad"}`}>
          <p><strong>{inline(tr(text, result.feedback))}</strong></p>
          {result.ruleFeedback && <p>{inline(tr(text, result.ruleFeedback))}</p>}
          {(result.correct || result.ruleFeedback) && <p className="why">{inline(tr(text, exercise.explanation))}</p>}
        </div>
      )}
      {/* Saving never blocks feedback; only a real problem is worth a word. */}
      {save.status === "failed" && <p className="muted small" role="status">{labels.saveFailed}</p>}
      {save.status === "stale" && <p className="banner" role="status">{labels.stale}</p>}
    </section>
  );
}
