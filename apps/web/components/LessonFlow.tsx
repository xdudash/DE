"use client";

/**
 * The lesson as a guided run (the app's lesson mode).
 *
 *   top:    leave · progress · hearts
 *   middle: one card per step — a piece of the explanation, or one exercise
 *   bottom: one action. On an exercise it is "Check" until answered; then the bar turns
 *           green or red, says why, and offers "Continue".
 *
 * A wrongly answered exercise comes back once at the end of the run (lib/lesson-session).
 * Hearts limit practice only: at zero, checking pauses, and every explanation stays open.
 * Teaching text arrives from the server as content; this component only sequences it.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { EvaluationResult } from "@deutschgo/content-kit/evaluate";
import type { Exercise } from "@deutschgo/content-kit/types";
import { translator } from "@deutschgo/i18n";
import { HEARTS, minutesUntil } from "@deutschgo/gamification";
import { clock, requeueIfWrong, sessionResult, type SessionAnswer } from "../lib/lesson-session";
import { inline } from "../lib/markdown";
import { play } from "../lib/sound";
import { ExercisePlayer, tr, type ExerciseHandle, type PlayerText } from "./ExercisePlayer";
import { Icon } from "./Icon";
import { useMotivation } from "./Motivation";
import { SaveStatus } from "./SaveStatus";

export type FlowStep =
  | { kind: "learn"; id: string; content: ReactNode }
  | { kind: "exercise"; id: string; exercise: Exercise; caption: string; exerciseId?: string; retry?: boolean };

export interface LessonFlowProps {
  lang: string;
  unit: { id: string; version: string; concepts: string[]; title: string; reviewed: boolean };
  steps: FlowStep[];
  text: PlayerText;
  next?: { href: string; title: string };
  saveNotice: { notSaved: string; saved: string };
}

function buzz(pattern: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    // Vibration is optional feedback; a refusal changes nothing for the learner.
  }
}

export function LessonFlow({ lang, unit, steps, text, next, saveNotice }: LessonFlowProps) {
  const msg = translator(lang);
  const motivation = useMotivation();
  const playerRef = useRef<ExerciseHandle>(null);
  const [queue, setQueue] = useState<FlowStep[]>(steps);
  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState<EvaluationResult | null>(null);
  const [ready, setReady] = useState(false);
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [finishedAt, setFinishedAt] = useState<number | null>(null);

  const done = index >= queue.length;
  const step = done ? undefined : queue[index];
  const hearts = motivation?.hearts ?? HEARTS.max;
  const outOfHearts = motivation !== null && hearts === 0;
  const isLast = index === queue.length - 1;
  const labels = { yourAnswer: msg("exercise.yourAnswer"), saveFailed: msg("exercise.saveFailed"), stale: msg("exercise.stale") };

  const check = useCallback(() => {
    if (!step || step.kind !== "exercise" || checked || outOfHearts) return;
    const result = playerRef.current?.check();
    if (!result) return;
    setChecked(result);
    setAnswers((a) => [...a, { exerciseId: step.exercise.id, correct: result.correct, retry: !!step.retry }]);
    setQueue((q) => requeueIfWrong(q, index, result.correct));
    play(result.correct ? "right" : "wrong");
    buzz(result.correct ? 20 : [40, 60, 40]);
  }, [step, checked, outOfHearts, index]);

  const advance = useCallback(() => {
    setChecked(null);
    setReady(false);
    setIndex((i) => i + 1);
    window.scrollTo({ top: 0 });
  }, []);

  function restart() {
    setQueue(steps);
    setIndex(0);
    setChecked(null);
    setReady(false);
    setAnswers([]);
    setStartedAt(Date.now());
    setFinishedAt(null);
    window.scrollTo({ top: 0 });
  }

  useEffect(() => {
    if (done && finishedAt === null) {
      setFinishedAt(Date.now());
      play("arrive");
    }
  }, [done, finishedAt]);

  // The one action at the bottom of the screen, whatever the step.
  const primary = !step
    ? null
    : step.kind === "learn"
      ? { label: isLast ? msg("flow.finish") : msg("flow.continue"), run: advance, disabled: false, tone: "primary" }
      : !checked
        ? { label: msg("exercise.check"), run: check, disabled: !ready || outOfHearts, tone: "primary" }
        : { label: isLast ? msg("flow.finish") : msg("flow.continue"), run: advance, disabled: false, tone: checked.correct ? "ok" : "bad" };

  // Enter moves on, as in any app; fields and buttons keep their own Enter behaviour.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.defaultPrevented || !primary || primary.disabled) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("button, a, textarea, select, input:not([type=radio])")) return;
      e.preventDefault();
      primary.run();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const total = queue.length;
  const position = Math.min(index, total);

  return (
    <div className="flow">
      <header className="flow-top">
        <Link href={`/${lang}`} className="flow-close" aria-label={msg("flow.close")}>
          <Icon name="close" size={22} />
        </Link>
        <div
          className="flow-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={position}
          aria-label={msg("flow.step", { current: Math.min(index + 1, total), total })}
        >
          <span style={{ inlineSize: `${total > 0 ? (position / total) * 100 : 0}%` }} />
        </div>
        <span className={`pill hearts${hearts === 0 ? " empty" : ""}`} role="img" aria-label={msg("motivation.hearts", { hearts, max: HEARTS.max })}>
          <Icon name="heart" size={20} />
          <span aria-hidden="true">{hearts}</span>
        </span>
      </header>

      <main className="flow-body lesson">
        {step && (
          <div className="flow-card" key={step.id}>
            <div className="card-meta">
              {step.kind === "exercise" && <span className="caption">{step.caption}</span>}
              {step.kind === "exercise" && step.retry && <span className="chip retry">{msg("flow.retry")}</span>}
              {/* The introduction states the review status itself; later cards keep a small label. */}
              {!unit.reviewed && step.id !== "intro" && <span className="tag warn">{msg("status.draftTag")}</span>}
            </div>
            {step.kind === "learn" ? (
              <div className="learn-card">{step.content}</div>
            ) : (
              <ExercisePlayer
                key={step.id}
                ref={playerRef}
                exercise={step.exercise}
                text={text}
                labels={labels}
                unit={{ id: unit.id, version: unit.version, concepts: unit.concepts }}
                checked={checked}
                onReadyChange={setReady}
                onSubmit={check}
              />
            )}
          </div>
        )}

        {done && (
          <Arrival
            lang={lang}
            title={unit.title}
            result={sessionResult(answers)}
            elapsed={(finishedAt ?? Date.now()) - startedAt}
            streak={motivation?.streak ?? 0}
            next={next}
            saveNotice={saveNotice}
            onRestart={restart}
          />
        )}
      </main>

      {primary && (
        <footer className={`flow-footer${checked ? (checked.correct ? " is-ok" : " is-bad") : ""}`}>
          {checked && step?.kind === "exercise" && (
            <div className="verdict" role="status">
              <span className="verdict-icon" aria-hidden="true">
                <Icon name={checked.correct ? "check" : "close"} size={22} />
              </span>
              <div className="verdict-text">
                <p className="verdict-title">{checked.correct ? msg("flow.correctTitle") : msg("flow.wrongTitle")}</p>
                {/* The exercise's general "correct" line only repeats the title; specific feedback always shows. */}
                {!(checked.correct && checked.feedback === step.exercise.feedback.correct) && <p>{inline(tr(text, checked.feedback))}</p>}
                {checked.ruleFeedback && <p>{inline(tr(text, checked.ruleFeedback))}</p>}
                <p className="why">{inline(tr(text, step.exercise.explanation))}</p>
                {!checked.correct && !step.retry && <p className="small">{msg("flow.requeued")}</p>}
              </div>
            </div>
          )}
          {!checked && outOfHearts && step?.kind === "exercise" && (
            <p className="flow-hint" role="status">
              {msg("motivation.outOfHearts", { minutes: motivation?.nextHeartAt ? minutesUntil(motivation.nextHeartAt, Date.now()) : 30 })}
            </p>
          )}
          <button type="button" className={`btn btn-block btn-${primary.tone}`} disabled={primary.disabled} onClick={primary.run}>
            {primary.label}
          </button>
        </footer>
      )}
    </div>
  );
}

function Arrival({
  lang,
  title,
  result,
  elapsed,
  streak,
  next,
  saveNotice,
  onRestart,
}: {
  lang: string;
  title: string;
  result: ReturnType<typeof sessionResult>;
  elapsed: number;
  streak: number;
  next?: { href: string; title: string };
  saveNotice: { notSaved: string; saved: string };
  onRestart: () => void;
}) {
  const msg = translator(lang);
  return (
    <section className="arrive" aria-labelledby="arrive-title">
      <div className="medal" aria-hidden="true">
        <Icon name="check" size={48} />
      </div>
      <h1 id="arrive-title">{msg("done.title")}</h1>
      <p className="arrive-sub">{title}</p>
      <ul className="tiles">
        <li className="tile tile-xp">
          <span className="tile-label"><Icon name="bolt" size={16} />{msg("done.xp")}</span>
          <strong>+{result.xp}</strong>
        </li>
        <li className="tile tile-acc">
          <span className="tile-label"><Icon name="target" size={16} />{msg("done.accuracy")}</span>
          <strong>{result.accuracy === null ? "–" : `${Math.round(result.accuracy * 100)}%`}</strong>
        </li>
        <li className="tile tile-time">
          <span className="tile-label"><Icon name="clock" size={16} />{msg("done.time")}</span>
          <strong>{clock(elapsed)}</strong>
        </li>
      </ul>
      {streak > 0 && (
        <p className="streak-line">
          <Icon name="flame" size={20} />
          {msg("motivation.streak", { days: streak })}
        </p>
      )}
      <p className="muted small">{msg("lesson.deviceOnly")}</p>
      <SaveStatus notSavedText={saveNotice.notSaved} savedText={saveNotice.saved} />
      <div className="arrive-actions">
        {next ? (
          <Link className="btn btn-primary btn-block" href={next.href}>{msg("lesson.next")}: {next.title}</Link>
        ) : (
          <Link className="btn btn-primary btn-block" href={`/${lang}`}>{msg("done.home")}</Link>
        )}
        <button type="button" className="btn btn-block" onClick={onRestart}>{msg("done.again")}</button>
      </div>
    </section>
  );
}
