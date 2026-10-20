"use client";

/**
 * How far through this lesson's exercises the learner is, from answers recorded in
 * this browser. It appears only once there is something to report.
 */
import { useEffect, useState } from "react";
import { translator } from "@deutschgo/i18n";
import { readLessonResults } from "../lib/device-state";

export function LessonProgress({ lang, unitId, total }: { lang: string; unitId: string; total: number }) {
  const msg = translator(lang);
  const [answered, setAnswered] = useState<number | null>(null);

  useEffect(() => {
    setAnswered(Object.keys(readLessonResults(unitId)).length);
  }, [unitId]);

  if (total === 0 || answered === null || answered === 0) return null;
  const percent = Math.round((answered / total) * 100);

  return (
    <div className="lesson-progress">
      <div
        className="statbar"
        role="progressbar"
        aria-valuenow={answered}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={msg("lesson.answered", { answered, total })}
      >
        <span style={{ inlineSize: `${percent}%` }} />
      </div>
      <p className="small muted">{msg("lesson.answered", { answered, total })}</p>
    </div>
  );
}
