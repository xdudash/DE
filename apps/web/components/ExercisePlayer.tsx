"use client";

/**
 * One exercise's answer area. The lesson flow owns the buttons and the verdict: it asks
 * this component to check through its ref, and passes the result back so the answer area
 * can show which part was right. Evaluation uses the same deterministic evaluator as the
 * content validator, and the server re-evaluates before storing anything.
 *
 * Saving is opportunistic: feedback never waits for the network, and without a session
 * the endpoint answers "not signed in", which the lesson states plainly.
 */
import { useEffect, useImperativeHandle, useState, type KeyboardEvent, type Ref } from "react";
import { evaluate, type EvaluationResult, type Response } from "@deutschgo/content-kit/evaluate";
import type { Exercise } from "@deutschgo/content-kit/types";
import { submitAttempt, type SubmitState } from "../lib/attempts/submit";
import { recordAttempt } from "../lib/device-state";
import { inline } from "../lib/markdown";

export interface PlayerText {
  [key: string]: string;
}

export interface PlayerLabels {
  yourAnswer: string;
  saveFailed: string;
  stale: string;
}

export interface ExerciseHandle {
  /** Evaluates the current answer, records it, and returns the verdict; null if not ready. */
  check(): EvaluationResult | null;
}

interface Props {
  exercise: Exercise;
  text: PlayerText;
  labels: PlayerLabels;
  /** Unit id and version, needed so the server can resolve exactly this exercise. */
  unit: { id: string; version: string; concepts: string[] };
  /** The verdict once checked; the answer area locks and marks right and wrong parts. */
  checked: EvaluationResult | null;
  onReadyChange: (ready: boolean) => void;
  /** Enter in a text field asks the flow to check. */
  onSubmit: () => void;
  ref?: Ref<ExerciseHandle>;
}

export const tr = (text: PlayerText, ref: string | undefined) => (ref ? text[ref.replace(/^@/, "")] ?? ref : "");

export function ExercisePlayer({ exercise, text, labels, unit, checked, onReadyChange, onSubmit, ref }: Props) {
  const [save, setSave] = useState<SubmitState>({ status: "off" });
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
  const locked = checked !== null;

  useEffect(() => onReadyChange(ready), [ready, onReadyChange]);

  useImperativeHandle(
    ref,
    () => ({
      check() {
        if (!ready || locked) return null;
        let response: Response;
        switch (exercise.type) {
          case "single_choice": response = { type: "single_choice", optionId: choice }; break;
          case "word_order": response = { type: "word_order", order }; break;
          case "cloze": response = { type: "cloze", gaps }; break;
          case "transform": response = { type: "transform", text: free }; break;
        }
        let outcome: EvaluationResult;
        try {
          outcome = evaluate(exercise, response);
        } catch (e) {
          setError((e as Error).message);
          return null;
        }
        setError(null);
        // Evidence for the learning engine, kept in this browser (see lib/device-state.ts).
        recordAttempt({ unitId: unit.id, exerciseId: exercise.id, conceptIds: unit.concepts, correct: outcome.correct });
        // One id per answer: a retry of the same request must not count twice.
        setSave({ status: "saving" });
        void submitAttempt({
          eventId: crypto.randomUUID(),
          unitId: unit.id,
          exerciseId: exercise.id,
          contentVersion: unit.version,
          response,
        }).then(setSave, () => setSave({ status: "failed", reason: "unexpected" }));
        return outcome;
      },
    }),
    [ready, locked, exercise, choice, order, gaps, free, unit],
  );

  const enterChecks = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <section className="exercise" aria-labelledby={`${exercise.id}-prompt`}>
      <p id={`${exercise.id}-prompt`} className="prompt">{inline(tr(text, exercise.prompt))}</p>

      {exercise.type === "single_choice" && (
        <>
          {exercise.stem_de && <p lang="de" className="de stem">{exercise.stem_de}</p>}
          <fieldset className="options" disabled={locked}>
            <legend className="sr-only">{tr(text, exercise.prompt)}</legend>
            {exercise.options.map((o, i) => {
              const mark = locked ? (o.correct ? " is-right" : choice === o.id ? " is-wrong" : "") : "";
              return (
                <label key={o.id} className={`option${choice === o.id ? " selected" : ""}${mark}`}>
                  <input type="radio" name={exercise.id} value={o.id} checked={choice === o.id} onChange={() => setChoice(o.id)} />
                  <span className="option-key" aria-hidden="true">{i + 1}</span>
                  <span className="option-text" lang={o.de ? "de" : undefined}>{o.de ?? tr(text, o.text)}</span>
                </label>
              );
            })}
          </fieldset>
        </>
      )}

      {exercise.type === "word_order" && (
        <>
          <div
            className={`built${locked ? (checked?.correct ? " is-right" : " is-wrong") : ""}`}
            role="group"
            aria-label={labels.yourAnswer}
          >
            {order.map((tokenIndex, position) => (
              <button
                key={`${tokenIndex}-${position}`}
                type="button"
                lang="de"
                className="token placed"
                disabled={locked}
                onClick={() => setOrder(order.filter((_, p) => p !== position))}
              >
                {exercise.tokens[tokenIndex]}
              </button>
            ))}
            {order.length === exercise.tokens.length && <span className="punct" lang="de">{exercise.final_punctuation}</span>}
          </div>
          <div className="tokens">
            {exercise.tokens.map((tok, i) => (
              <button
                key={i}
                type="button"
                lang="de"
                className={`token${order.includes(i) ? " used" : ""}`}
                disabled={locked || order.includes(i)}
                onClick={() => setOrder([...order, i])}
              >
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
            const gr = checked?.gaps?.[gi];
            return (
              <input
                key={i}
                className={`gap${gr ? (gr.correct ? " ok" : " bad") : ""}`}
                aria-label={`${labels.yourAnswer} ${gi + 1}`}
                value={gaps[gi] ?? ""}
                disabled={locked}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                onKeyDown={enterChecks}
                onChange={(e) => {
                  const g = [...gaps];
                  g[gi] = e.target.value;
                  setGaps(g);
                }}
              />
            );
          })}
        </p>
      )}

      {exercise.type === "transform" && (
        <>
          <p lang="de" className="de stem">{exercise.source_de}</p>
          <input
            className={`free${locked ? (checked?.correct ? " ok" : " bad") : ""}`}
            lang="de"
            aria-label={labels.yourAnswer}
            value={free}
            disabled={locked}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            onKeyDown={enterChecks}
            onChange={(e) => setFree(e.target.value)}
          />
        </>
      )}

      {error && <p role="alert" className="banner">{error}</p>}
      {/* Saving never blocks feedback; only a real problem is worth a word. */}
      {save.status === "failed" && <p className="muted small" role="status">{labels.saveFailed}</p>}
      {save.status === "stale" && <p className="banner" role="status">{labels.stale}</p>}
    </section>
  );
}
