"use client";

import { translator } from "@deutschgo/i18n";
import Link from "next/link";
import type { PathDifficulty } from "../lib/device-state";
import type { CourseRoadmapLevel } from "../lib/course-paths";

export function CourseRoadmap({ lang, difficulty, levels }: { lang: string; difficulty: PathDifficulty; levels: CourseRoadmapLevel[] }) {
  const msg = translator(lang);
  const number = (value: number) => new Intl.NumberFormat(lang).format(value);
  const pathLabel = msg(`learningPath.${difficulty}` as "learningPath.easy" | "learningPath.medium" | "learningPath.hard");
  const stepCount = levels.reduce((total, level) => total + level.steps, 0);

  return <section className="course-roadmap card" aria-labelledby="course-roadmap-title">
    <header className="course-roadmap-heading">
      <div><p className="eyebrow">{msg("routeStudio.editorEyebrow")}</p><h2 id="course-roadmap-title">{msg("learningPath.mapTitle")} · {pathLabel}</h2>
        <p className="muted small">{msg("learningPath.mapDescription", { steps: number(stepCount) })}</p></div>
    </header>
    <div className="course-roadmap-levels">
      {levels.map((level, index) => <details className="course-roadmap-level" key={`${difficulty}-${level.level}`} open={index === 0}>
        <summary>
          <span className="course-roadmap-level-badge">{level.level}</span>
          <span className="course-roadmap-level-title">{msg("learningPath.levelSteps", { level: level.level, count: number(level.steps) })}</span>
          <span className="course-roadmap-block-count">{msg("learningPath.blockCount", { count: number(level.blocks.length) })}</span>
        </summary>
        <ol className="course-roadmap-blocks">
          {level.blocks.map((block) => <li key={block.id}>
            <strong>{block.id}</strong>
            <span>{msg("learningPath.steps", { count: number(block.steps) })}</span>
            <small>{msg("learningPath.breakdown", { lessons: number(block.lessons), scenarios: number(block.scenarios), checkpoints: number(block.checkpoints) })}</small>
            {block.modules.length > 0 && <div className="course-roadmap-modules" aria-label={msg("learningPath.availableModules")}>
              {block.modules.map((module) => <Link key={module.id} href={module.href}>▶ {module.title}</Link>)}
            </div>}
          </li>)}
        </ol>
      </details>)}
    </div>
  </section>;
}
