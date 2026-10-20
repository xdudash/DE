"use client";

/**
 * The lesson as a guided run, one step at a time (the app's lesson mode):
 * a top bar with leave, progress and hearts; one card per step; and a bottom bar with the
 * single action. Exercises need an answer before "Continue" is enabled. Wrong answers
 * may still continue: the explanation has been shown and hearts already limit practice.
 *
 * Teaching text arrives from the server as content; this component only sequences it.
 */
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { translator } from "@deutschgo/i18n";
import { HEARTS } from "@deutschgo/gamification";
import type { Exercise } from "@deutschgo/content-kit/types";
import { ExercisePlayer, type PlayerLabels, type PlayerText } from "./ExercisePlayer";
import { LessonSummary } from "./LessonSummary";
import { SaveStatus } from "./SaveStatus";
import { useHearts } from "./Motivation";

export type FlowStep =
  | { kind: "learn"; id: string; content: ReactNode }
  | { kind: "exercise"; id: string; exercise: Exercise; caption: string };

export interface LessonFlowProps {
  lang: string;
  unit: { id: string; version: string; concepts: string[]; title: string; reviewed: boolean };
  steps: FlowStep[];
  text: PlayerText;
  labels: PlayerLabels;
  exerciseIds: string[];
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

export function LessonFlow({ lang, unit, steps, text, labels, exerciseIds, next, saveNotice }: LessonFlowProps) {
  const msg = translator(lang);
  const hearts = useHearts();
  const [index, setIndex] = useState(0);
  // Answered in this visit: exercise id -> correct. Enables "Continue" for that exercise.
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  const total = steps.length;
  const done = index >= total;
  const step = done ? undefined : steps[index];
  const canContinue = !step || step.kind === "learn" || step.id in answers;
  const isLast = index === total - 1;
  const shown = Math.min(index + 1, total);

  function advance() {
    setIndex((i) => Math.min(i + 1, total));
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="flow">
      <header className="flow-top">
        <Link href={`/${lang}`} className="flow-close" aria-label={msg("flow.close")}>
          <span aria-hidden="true">×</span>
        </Link>
        <div
          className="flow-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={Math.min(index, total)}
          aria-label={msg("flow.step", { current: shown, total })}
        >
          <span style={{ inlineSize: `${(Math.min(index, total) / total) * 100}%` }} />
        </div>
        {!unit.reviewed && <span className="tag warn flow-tag">{msg("status.draftTag")}</span>}
        {hearts && (
          <span className="flow-hearts" aria-label={msg("motivation.hearts", { hearts: hearts.hearts, max: HEARTS.max })}>
            <span aria-hidden="true">♥</span> {hearts.hearts}
          </span>
        )}
      </header>

      <main className="flow-body lesson">
        {!done && step?.kind === "learn" && <section className="flow-card">{step.content}</section>}
        {!done && step?.kind === "exercise" && (
          <section className="flow-card">
            <p className="muted small flow-caption">{step.caption}</p>
            <ExercisePlayer
              key={step.id}
              exercise={step.exercise}
              text={text}
              labels={labels}
              unit={{ id: unit.id, version: unit.version, concepts: unit.concepts }}
              onResult={(correct) => {
                setAnswers((a) => ({ ...a, [step.id]: correct }));
                buzz(correct ? 20 : [40, 60, 40]);
              }}
            />
          </section>
        )}
        {done && (
          <section className="flow-card">
            <h1 className="flow-title">{unit.title}</h1>
            <LessonSummary lang={lang} unitId={unit.id} exerciseIds={exerciseIds} next={next} />
            <SaveStatus notSavedText={saveNotice.notSaved} savedText={saveNotice.saved} />
          </section>
        )}
      </main>

      {!done && (
        <footer className="flow-footer">
          {!canContinue && <p className="small muted flow-hint">{msg("flow.answerFirst")}</p>}
          <button type="button" className="primary flow-continue" disabled={!canContinue} onClick={advance}>
            {isLast ? msg("flow.finish") : msg("flow.continue")}
          </button>
        </footer>
      )}
    </div>
  );
}
