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
import { evaluate, signalledConcepts, type EvaluationResult, type Response } from "@deutschgo/content-kit/evaluate";
import type { DictationExercise, ErrorCorrectionExercise, Exercise, TextInputExercise } from "@deutschgo/content-kit/types";
import { submitAttempt, type SubmitState } from "../lib/attempts/submit";
import { sendWithOutbox } from "../lib/attempts/outbox";
import { ACCOUNT_PROGRESS_EVENT, deviceKeyValue, recordAttempt } from "../lib/device-state";
import { inline } from "../lib/markdown";

export interface PlayerText {
  [key: string]: string;
}

export interface PlayerLabels {
  yourAnswer: string;
  saveFailed: string;
  saveQueued: string;
  stale: string;
  true: string;
  false: string;
  chooseMatch: string;
  chooseCategory: string;
  categoryScore: (correct: number, total: number) => string;
  chooseAll: string;
  playAudio: string;
  playAgain: string;
  speechNote: string;
  speechUnavailable: string;
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
  /** A practice run: wrong answers cost a heart (ADR-0014). */
  practice: boolean;
  /** Enter in a text field asks the flow to check. */
  onSubmit: () => void;
  ref?: Ref<ExerciseHandle>;
}

/** The six single-box answer types (ADR-0023 batch 1); transform shares the same box. */
const TEXT_INPUT_TYPES: ReadonlySet<string> = new Set([
  "article_input",
  "form_input",
  "gap_fill_input",
  "spelling_input",
  "number_input",
  "time_input",
  "dictation",
  "error_correction",
]);
const isTextInput = (e: Exercise): e is TextInputExercise | DictationExercise | ErrorCorrectionExercise => TEXT_INPUT_TYPES.has(e.type);

export const tr = (text: PlayerText, ref: string | undefined) => (ref ? text[ref.replace(/^@/, "")] ?? ref : "");

export function ExercisePlayer({ exercise, text, labels, unit, checked, onReadyChange, onSubmit, ref, practice }: Props) {
  const [save, setSave] = useState<SubmitState>({ status: "off" });
  const [choice, setChoice] = useState<string>("");
  const [multi, setMulti] = useState<string[]>([]);
  const [truth, setTruth] = useState<boolean | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<number[]>([]);
  const [verbPosition, setVerbPosition] = useState<number | null>(null);
  const [gaps, setGaps] = useState<string[]>(() => (exercise.type === "cloze" ? exercise.gaps.map(() => "") : []));
  const [free, setFree] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);

  useEffect(() => {
    setHasPlayed(false);
    setSpeechAvailable(typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [exercise.id]);

  const speakGerman = (sentence: string) => {
    if (!speechAvailable) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = "de-DE";
    const voice = window.speechSynthesis.getVoices().find((candidate) => candidate.lang.toLowerCase().startsWith("de"));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const playGerman = () => {
    if ((exercise.type !== "listening_choice" && exercise.type !== "dictation" && exercise.type !== "minimal_pairs") || !speechAvailable) return;
    speakGerman(exercise.audio_text_de);
    setHasPlayed(true);
  };

  const ready =
    ((exercise.type === "single_choice" || exercise.type === "reply_choice" || exercise.type === "listening_choice" || exercise.type === "minimal_pairs") && choice !== "" && (exercise.type !== "listening_choice" && exercise.type !== "minimal_pairs" || !speechAvailable || hasPlayed)) ||
    (exercise.type === "multi_choice" && multi.length > 0) ||
    (exercise.type === "true_false" && truth !== null) ||
    (exercise.type === "match_pairs" && exercise.pairs.every((p) => !!matches[p.id])) ||
    (exercise.type === "categorize" && exercise.items.every((item) => !!assignments[item.id])) ||
    (exercise.type === "word_order" && order.length === exercise.tokens.length) ||
    (exercise.type === "token_bank_build" && order.length > 0) ||
    (exercise.type === "verb_position" && verbPosition !== null) ||
    (exercise.type === "cloze" && gaps.every((g) => g.trim() !== "")) ||
    ((exercise.type === "transform" || exercise.type === "keyword_build" || isTextInput(exercise)) && free.trim() !== "" && (exercise.type !== "dictation" || !speechAvailable || hasPlayed));
  const locked = checked !== null;

  useEffect(() => onReadyChange(ready), [ready, onReadyChange]);

  /** Picking a right-hand item that another row already uses moves it, so no item is paired twice. */
  const pickMatch = (leftId: string, rightId: string) =>
    setMatches((current) => {
      const next = { ...current };
      for (const key of Object.keys(next)) if (next[key] === rightId) delete next[key];
      if (rightId === "") delete next[leftId];
      else next[leftId] = rightId;
      return next;
    });

  useImperativeHandle(
    ref,
    () => ({
      check() {
        if (!ready || locked) return null;
        let response: Response;
        switch (exercise.type) {
          case "single_choice": response = { type: "single_choice", optionId: choice }; break;
          case "reply_choice": response = { type: "reply_choice", optionId: choice }; break;
          case "listening_choice": response = { type: "listening_choice", optionId: choice }; break;
          case "minimal_pairs": response = { type: "minimal_pairs", optionId: choice }; break;
          case "dictation": response = { type: "dictation", text: free }; break;
          case "error_correction": response = { type: "error_correction", text: free }; break;
          case "multi_choice": response = { type: "multi_choice", optionIds: multi }; break;
          case "true_false": response = { type: "true_false", value: truth === true }; break;
          case "match_pairs": response = { type: "match_pairs", matches }; break;
          case "categorize": response = { type: "categorize", assignments }; break;
          case "word_order": response = { type: "word_order", order }; break;
          case "token_bank_build": response = { type: "token_bank_build", order }; break;
          case "verb_position": response = { type: "verb_position", tokenIndex: verbPosition ?? -1 }; break;
          case "cloze": response = { type: "cloze", gaps }; break;
          case "transform": response = { type: "transform", text: free }; break;
          case "keyword_build": response = { type: "keyword_build", text: free }; break;
          default: response = { type: exercise.type, text: free }; break;
        }
        let outcome: EvaluationResult;
        try {
          outcome = evaluate(exercise, response);
        } catch (e) {
          setError((e as Error).message);
          return null;
        }
        setError(null);
        // One id and one time per answer, shared by this browser's record and the account's
        // copy; retries reuse both, so an answer is never counted twice.
        const eventId = crypto.randomUUID();
        const at = Date.now();
        // Evidence for the learning engine, kept in this browser (see lib/device-state.ts).
        recordAttempt({ id: eventId, at, unitId: unit.id, exerciseId: exercise.id, conceptIds: exercise.concepts, correct: outcome.correct, signals: signalledConcepts(outcome), practice, response, contentVersion: unit.version });
        setSave({ status: "saving" });
        const submission = { eventId, unitId: unit.id, exerciseId: exercise.id, contentVersion: unit.version, response, occurredAt: new Date(at).toISOString() };
        void sendWithOutbox(deviceKeyValue(), submission, (item) => submitAttempt(item), at).then(
          ({ state, queued }) => {
            setSave(queued ? { status: "queued" } : state);
            if (state.status === "saved") window.dispatchEvent(new Event(ACCOUNT_PROGRESS_EVENT));
          },
          () => setSave({ status: "failed", reason: "unexpected" }),
        );
        return outcome;
      },
    }),
    [ready, locked, exercise, choice, multi, truth, matches, assignments, order, gaps, free, unit, practice],
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

      {(exercise.type === "single_choice" || exercise.type === "reply_choice") && (
        <>
          {exercise.type === "single_choice" && exercise.stem_de && <p lang="de" className="de stem">{exercise.stem_de}</p>}
          {exercise.type === "reply_choice" && <p lang="de" className="de stem reply">{exercise.line_de}</p>}
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

      {exercise.type === "listening_choice" && (
        <>
          <div className="listening-audio">
            <button type="button" className="btn secondary" onClick={playGerman} disabled={locked || !speechAvailable}>
              {hasPlayed ? labels.playAgain : labels.playAudio}
            </button>
            <span className="muted small">{speechAvailable ? labels.speechNote : labels.speechUnavailable}</span>
          </div>
          {!speechAvailable && <p lang="de" className="de stem listening-transcript">{exercise.audio_text_de}</p>}
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

      {exercise.type === "minimal_pairs" && (
        <>
          <div className="listening-audio">
            <button type="button" className="btn" onClick={playGerman} disabled={locked || !speechAvailable}>
              {hasPlayed ? labels.playAgain : labels.playAudio}
            </button>
            <span className="muted small">{speechAvailable ? labels.speechNote : labels.speechUnavailable}</span>
          </div>
          {!speechAvailable && <p lang="de" className="de stem listening-transcript">{exercise.audio_text_de}</p>}
          <fieldset className="options minimal-pairs" disabled={locked}>
            <legend className="sr-only">{tr(text, exercise.prompt)}</legend>
            {exercise.options.map((option, i) => {
              const mark = locked ? (option.correct ? " is-right" : choice === option.id ? " is-wrong" : "") : "";
              return (
                <div key={option.id} className="minimal-pair-row">
                  <label className={`option minimal-pair-option${choice === option.id ? " selected" : ""}${mark}`}>
                    <input type="radio" name={exercise.id} value={option.id} checked={choice === option.id} onChange={() => setChoice(option.id)} />
                    <span className="option-key" aria-hidden="true">{i + 1}</span>
                    <span className="option-text" lang="de">{option.de}</span>
                  </label>
                  <button type="button" className="minimal-pair-play" onClick={() => speakGerman(option.de)} disabled={locked || !speechAvailable} aria-label={`${labels.playAudio}: ${option.de}`}>
                    {labels.playAudio}
                  </button>
                </div>
              );
            })}
          </fieldset>
        </>
      )}

      {exercise.type === "dictation" && (
        <>
          <div className="listening-audio">
            <button type="button" className="btn" onClick={playGerman} disabled={locked || !speechAvailable}>
              {hasPlayed ? labels.playAgain : labels.playAudio}
            </button>
            <span className="muted small">{speechAvailable ? labels.speechNote : labels.speechUnavailable}</span>
          </div>
          {!speechAvailable && <p lang="de" className="de stem listening-transcript">{exercise.audio_text_de}</p>}
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

      {exercise.type === "multi_choice" && (
        <>
          {exercise.stem_de && <p lang="de" className="de stem">{exercise.stem_de}</p>}
          <fieldset className="options" disabled={locked}>
            <legend className="sr-only">{tr(text, exercise.prompt)}</legend>
            {exercise.options.map((o, i) => {
              const picked = multi.includes(o.id);
              // Every correct option is shown as right, so a missed one is visible too.
              const mark = locked ? (o.correct ? " is-right" : picked ? " is-wrong" : "") : "";
              return (
                <label key={o.id} className={`option${picked ? " selected" : ""}${mark}`}>
                  <input
                    type="checkbox"
                    name={exercise.id}
                    value={o.id}
                    checked={picked}
                    onChange={() => setMulti(picked ? multi.filter((id) => id !== o.id) : [...multi, o.id])}
                  />
                  <span className="option-key" aria-hidden="true">{i + 1}</span>
                  <span className="option-text" lang={o.de ? "de" : undefined}>{o.de ?? tr(text, o.text)}</span>
                </label>
              );
            })}
          </fieldset>
        </>
      )}

      {exercise.type === "true_false" && (
        <>
          <p lang="de" className="de stem">{exercise.statement_de}</p>
          <fieldset className="options" disabled={locked}>
            <legend className="sr-only">{tr(text, exercise.prompt)}</legend>
            {[true, false].map((value) => {
              const picked = truth === value;
              const mark = locked ? (value === exercise.correct ? " is-right" : picked ? " is-wrong" : "") : "";
              return (
                <label key={String(value)} className={`option${picked ? " selected" : ""}${mark}`}>
                  <input type="radio" name={exercise.id} value={String(value)} checked={picked} onChange={() => setTruth(value)} />
                  <span className="option-text">{value ? labels.true : labels.false}</span>
                </label>
              );
            })}
          </fieldset>
        </>
      )}

      {exercise.type === "match_pairs" && (
        // The right-hand column is rotated so it never starts in the order of the left side.
        <fieldset className="match" disabled={locked}>
          <legend className="sr-only">{tr(text, exercise.prompt)}</legend>
          {exercise.pairs.map((p) => {
            const mark = locked ? (matches[p.id] === p.id ? " is-right" : " is-wrong") : "";
            return (
              <div key={p.id} className={`match-row${mark}`}>
                <span className="match-left" lang="de">{p.left_de}</span>
                <select
                  className="match-right"
                  lang="de"
                  aria-label={`${labels.yourAnswer}: ${p.left_de}`}
                  value={matches[p.id] ?? ""}
                  onChange={(e) => pickMatch(p.id, e.target.value)}
                >
                  <option value="">{labels.chooseMatch}</option>
                  {[...exercise.pairs.slice(1), ...exercise.pairs.slice(0, 1)].map((r) => (
                    <option key={r.id} value={r.id}>{r.right_de}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </fieldset>
      )}

      {exercise.type === "categorize" && (
        <fieldset className="match categorize" disabled={locked}>
          <legend className="sr-only">{labels.yourAnswer}</legend>
          {exercise.items.map((item) => {
            const evaluated = checked?.items?.find((answer) => answer.id === item.id);
            const feedback = evaluated?.feedback ? tr(text, evaluated.feedback) : "";
            return (
              <div key={item.id} className={`match-row categorize-row${locked ? (evaluated?.correct ? " is-right" : " is-wrong") : ""}`}>
                <span className="match-left" lang="de">{item.de}</span>
                <select
                  className="match-right"
                  aria-label={`${labels.yourAnswer}: ${item.de}`}
                  value={assignments[item.id] ?? ""}
                  onChange={(e) => setAssignments((current) => ({ ...current, [item.id]: e.target.value }))}
                >
                  <option value="">{labels.chooseCategory}</option>
                  {exercise.categories.map((category) => <option key={category.id} value={category.id}>{tr(text, category.label)}</option>)}
                </select>
                {feedback && <small className="categorize-feedback">{feedback}</small>}
              </div>
            );
          })}
        </fieldset>
      )}
      {exercise.type === "categorize" && checked?.items && (
        <p className="categorize-score" role="status">
          {labels.categoryScore(checked.items.filter((item) => item.correct).length, checked.items.length)}
        </p>
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

      {exercise.type === "verb_position" && (
        <div className="tokens verb-position" role="group" aria-label={labels.yourAnswer}>
          {exercise.tokens.map((token, index) => (
            <button
              key={index}
              type="button"
              lang="de"
              className={`token${verbPosition === index ? " placed" : ""}`}
              aria-pressed={verbPosition === index}
              disabled={locked}
              onClick={() => setVerbPosition(index)}
            >
              {token}
            </button>
          ))}
        </div>
      )}

      {exercise.type === "token_bank_build" && (
        <>
          <p className="muted small">{labels.chooseAll}</p>
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
                onClick={() => setOrder(order.filter((_, current) => current !== position))}
              >
                {exercise.tokens[tokenIndex]}
              </button>
            ))}
            {order.length > 0 && <span className="punct" lang="de">{exercise.final_punctuation}</span>}
          </div>
          <div className="tokens">
            {exercise.tokens.map((token, index) => (
              <button
                key={index}
                type="button"
                lang="de"
                className={`token${order.includes(index) ? " used" : ""}`}
                disabled={locked || order.includes(index)}
                onClick={() => setOrder([...order, index])}
              >
                {token}
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

      {(exercise.type === "transform" || exercise.type === "error_correction" || exercise.type === "keyword_build" || (isTextInput(exercise) && exercise.type !== "dictation")) && (
        <>
          {exercise.type === "transform" || exercise.type === "error_correction" ? (
            <p lang="de" className="de stem">{exercise.source_de}</p>
          ) : exercise.type !== "keyword_build" && exercise.stem_de ? (
            <p lang="de" className="de stem">{exercise.stem_de}</p>
          ) : null}
          {exercise.type === "keyword_build" && <ul className="keyword-build-bank" aria-label={labels.yourAnswer}>{exercise.keywords.map((keyword, index) => <li key={index} lang="de">{keyword}</li>)}</ul>}
          <input
            className={`free${locked ? (checked?.correct ? " ok" : " bad") : ""}`}
            lang="de"
            inputMode={exercise.type === "number_input" ? "numeric" : undefined}
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
      {save.status === "queued" && <p className="muted small" role="status">{labels.saveQueued}</p>}
      {save.status === "stale" && <p className="banner" role="status">{labels.stale}</p>}
    </section>
  );
}
