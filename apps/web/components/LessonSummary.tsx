"use client";

/**
 * End-of-lesson result. Counts this browser's latest answers for the lesson's exercises
 * and names the next lesson on the route. It shows "not finished" until every exercise
 * has been answered, instead of claiming a score it does not have.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { translator } from "@deutschgo/i18n";
import { XP } from "@deutschgo/gamification";
import { readLessonResults } from "../lib/device-state";

interface Props {
  lang: string;
  unitId: string;
  exerciseIds: string[];
  next?: { href: string; title: string };
}

export function LessonSummary({ lang, unitId, exerciseIds, next }: Props) {
  const msg = translator(lang);
  const [results, setResults] = useState<Record<string, boolean> | null>(null);

  // Read after mount: the server cannot see this browser's answers.
  useEffect(() => setResults(readLessonResults(unitId)), [unitId]);

  const total = exerciseIds.length;
  const answered = results ? exerciseIds.filter((id) => id in results).length : 0;
  const correct = results ? exerciseIds.filter((id) => results[id] === true).length : 0;
  const finished = results !== null && total > 0 && answered === total;
  // XP from the latest answer per exercise, using the same rule as the Motivation strip.
  const xp = results ? exerciseIds.reduce((sum, id) => (id in results ? sum + (results[id] ? XP.correct : XP.wrong) : sum), 0) : 0;

  return (
    <section className="summary" aria-labelledby="summary-heading">
      <h2 id="summary-heading">{msg("lesson.summary")}</h2>
      <div aria-live="polite">
        {results === null && <p className="muted">…</p>}
        {results !== null && finished && <p className="lead">{msg("exercise.score", { correct, total })}</p>}
        {results !== null && finished && <p className="flow-xp">{msg("flow.xp", { xp })}</p>}
        {results !== null && !finished && (
          <p>{msg("lesson.notDone", { answered, total })}</p>
        )}
      </div>
      <p className="muted small">{msg("lesson.deviceOnly")}</p>
      <div className="next">
        <h3>{msg("lesson.next")}</h3>
        {next ? (
          <p><Link className="cta" href={next.href}>{next.title}</Link></p>
        ) : (
          <p className="muted">{msg("lesson.noNext")}</p>
        )}
      </div>
    </section>
  );
}
