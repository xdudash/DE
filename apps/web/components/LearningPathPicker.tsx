"use client";

import { translator, type MessageKey } from "@deutschgo/i18n";
import type { PathDifficulty } from "../lib/device-state";

export interface LearningPathCounts {
  difficulty: PathDifficulty;
  steps: number;
  lessons: number;
  scenarios: number;
  checkpoints: number;
  authoredLessons: number;
  levels: Array<{ level: string; steps: number }>;
}

const PATH_COPY: Record<PathDifficulty, { title: MessageKey; description: MessageKey }> = {
  easy: { title: "learningPath.easy", description: "learningPath.easyDescription" },
  medium: { title: "learningPath.medium", description: "learningPath.mediumDescription" },
  hard: { title: "learningPath.hard", description: "learningPath.hardDescription" },
};

export function LearningPathPicker({ lang, difficulty, paths, onChange }: {
  lang: string;
  difficulty: PathDifficulty;
  paths: LearningPathCounts[];
  onChange: (difficulty: PathDifficulty) => void;
}) {
  const msg = translator(lang);
  const number = (value: number) => new Intl.NumberFormat(lang).format(value);
  const authoredLessons = paths[0]?.authoredLessons ?? 0;
  const activePath = paths.find((path) => path.difficulty === difficulty);
  const largestLevel = Math.max(1, ...(activePath?.levels.map((item) => item.steps) ?? []));

  return <fieldset className="learning-path-picker">
    <legend>{msg("learningPath.title")}</legend>
    <p className="muted">{msg("learningPath.lead")}</p>
    <div className="learning-path-grid">
      {paths.map((path) => {
        const copy = PATH_COPY[path.difficulty];
        const selected = difficulty === path.difficulty;
        return <label key={path.difficulty} className={`learning-path-option${selected ? " selected" : ""}`}>
          <input className="sr-only" type="radio" name="learning-path-depth" value={path.difficulty} checked={selected} onChange={() => onChange(path.difficulty)} />
          <span className="learning-path-check" aria-hidden="true">{selected ? "✓" : ""}</span>
          <span className="learning-path-copy">
            <strong>{msg(copy.title)}</strong>
            <span className="learning-path-size">{msg("learningPath.steps", { count: number(path.steps) })}</span>
            <small>{msg(copy.description)}</small>
            <small className="learning-path-breakdown">{msg("learningPath.breakdown", {
              lessons: number(path.lessons), scenarios: number(path.scenarios), checkpoints: number(path.checkpoints),
            })}</small>
          </span>
        </label>;
      })}
    </div>
    <section className="learning-path-levels" aria-labelledby="learning-path-levels-heading">
      <h3 id="learning-path-levels-heading">{msg("learningPath.byLevel")}</h3>
      <ol>{activePath?.levels.map(({ level, steps }) => <li key={level}>
        <span>{level}</span>
        <span className="learning-path-level-track" role="meter" aria-valuemin={0} aria-valuemax={largestLevel} aria-valuenow={steps} aria-label={msg("learningPath.levelSteps", { level, count: number(steps) })}>
          <i style={{ inlineSize: `${steps / largestLevel * 100}%` }} />
        </span>
        <strong>{number(steps)}</strong>
      </li>)}</ol>
    </section>
    <p className="learning-path-availability">{msg("learningPath.availability", { count: number(authoredLessons) })}</p>
  </fieldset>;
}
