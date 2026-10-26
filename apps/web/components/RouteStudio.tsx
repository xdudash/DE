"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { translator, type MessageKey } from "@deutschgo/i18n";
import { useProgress } from "../lib/progress/client";
import { orderedRouteSteps, useRoutePlan, type RoutePlanOption } from "../lib/route-plan-client";
import { readSetup, writeSetup, type PathDifficulty, type Setup } from "../lib/device-state";
import { LearningPathPicker, type LearningPathCounts } from "./LearningPathPicker";
import { CourseRoadmap } from "./CourseRoadmap";
import type { CourseRoadmapLevel } from "../lib/course-paths";

export function RouteStudio({ lang, routes, defaultRouteId, coursePaths, courseRoadmaps }: { lang: string; routes: RoutePlanOption[]; defaultRouteId: string; coursePaths: LearningPathCounts[]; courseRoadmaps: Record<PathDifficulty, CourseRoadmapLevel[]> }) {
  const msg = translator(lang);
  const plan = useRoutePlan(routes, defaultRouteId);
  const { attempts, status } = useProgress();
  const [notice, setNotice] = useState("");
  const [difficulty, setDifficulty] = useState<PathDifficulty>("medium");
  useEffect(() => setDifficulty(readSetup()?.difficulty ?? "medium"), []);
  const answered = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const attempt of attempts) {
      if (!map.has(attempt.unitId)) map.set(attempt.unitId, new Set());
      map.get(attempt.unitId)!.add(attempt.exerciseId);
    }
    return map;
  }, [attempts]);

  if (!plan.activeRoute) return <main className="page"><h1>{msg("routeStudio.empty")}</h1></main>;
  const active = plan.activeRoute;
  const settings = plan.preferences.routes[active.id];
  const allSteps = orderedRouteSteps(active, settings, true);
  const visibleSteps = plan.activeSteps;
  const skipped = new Set(settings?.skipped ?? []);
  const doneSteps = visibleSteps.filter((step) => step.kind === "lesson" && step.exerciseIds.length > 0 && step.exerciseIds.every((id) => answered.get(step.unitId ?? "")?.has(id)));
  const openLessons = visibleSteps.filter((step) => step.kind === "lesson").length;
  const progress = openLessons > 0 ? Math.round(doneSteps.length / openLessons * 100) : 0;
  const msgWrite = (ok: boolean, key: MessageKey) => setNotice(msg(ok ? key : "routeStudio.storageError"));
  function changeDifficulty(next: PathDifficulty) {
    const previous = readSetup() ?? { goal: "general", minutes: 10, difficulty: "medium" as const };
    const setup: Setup = { ...previous, difficulty: next };
    if (writeSetup(setup)) {
      setDifficulty(next);
      setNotice(msg("learningPath.saved"));
    } else setNotice(msg("routeStudio.storageError"));
  }

  return <main className="page route-studio">
    <header className="route-studio-heading">
      <div><p className="eyebrow">{msg("routeStudio.eyebrow")}</p><h1>{msg("routeStudio.title")}</h1><p className="lead">{msg("routeStudio.lead")}</p></div>
      <Link className="review-back" href={`/${lang}`}>← {msg("routeStudio.backHome")}</Link>
    </header>

    <section className="route-overview" aria-label={msg("routeStudio.activeRoute")}>
      <div className="route-overview-badge">{active.badge}</div>
      <div className="route-overview-copy"><p className="eyebrow">{msg("routeStudio.activeRoute")}</p><h2>{active.title}</h2><p className="muted">{active.summary}</p>
        <div className="route-chips"><span>{active.from} → {active.to}</span><span>{msg("routeStudio.stepsCount", { count: visibleSteps.length })}</span><span>{msg("routeStudio.lessonCount", { count: openLessons })}</span></div>
      </div>
      <div className="route-overview-progress"><strong>{status === "loading" ? "—" : `${progress}%`}</strong><span>{msg("routeStudio.completed", { count: doneSteps.length })}</span><span className="route-progress-track"><i style={{ inlineSize: `${progress}%` }} /></span></div>
    </section>

    <section className="card route-depth-card" aria-label={msg("learningPath.title")}>
      <LearningPathPicker lang={lang} difficulty={difficulty} paths={coursePaths} onChange={changeDifficulty} />
      {notice === msg("learningPath.saved") && <p role="status" className="route-notice">{notice}</p>}
    </section>

    <CourseRoadmap lang={lang} difficulty={difficulty} levels={courseRoadmaps[difficulty]} />

    <section className="route-choice-section">
      <div className="route-section-heading"><div><p className="eyebrow">{msg("routeStudio.chooseEyebrow")}</p><h2>{msg("routeStudio.availableRoutes")}</h2></div><span className="muted small">{msg("routeStudio.devicePlan")}</span></div>
      <div className="route-choice-grid">
        {routes.map((route) => {
          const isActive = route.id === plan.activeRouteId;
          const lessonCount = route.steps.filter((step) => step.kind === "lesson").length;
          return <article className={`route-choice${isActive ? " is-active" : ""}`} key={route.id}>
            <div className="route-choice-top"><span className="route-level">{route.from} → {route.to}</span>{isActive && <span className="route-active-tag">{msg("routeStudio.activeTag")}</span>}</div>
            <h3>{route.title}</h3><p className="muted">{route.summary}</p>
            <div className="route-choice-meta"><span>{msg("routeStudio.stepsCount", { count: route.steps.length })}</span><span>{msg("routeStudio.lessonCount", { count: lessonCount })}</span></div>
            <button type="button" className={isActive ? "btn btn-secondary" : "btn btn-primary"} aria-pressed={isActive} onClick={() => msgWrite(plan.selectRoute(route.id), "routeStudio.selected")}>{msg(isActive ? "routeStudio.selectedButton" : "routeStudio.useRoute")}</button>
          </article>;
        })}
      </div>
    </section>

    <section className="route-editor card">
      <header className="route-editor-heading"><div><p className="eyebrow">{msg("routeStudio.editorEyebrow")}</p><h2>{msg("routeStudio.editorTitle")}</h2><p className="muted small">{msg("routeStudio.editorHint")}</p></div>
        <button type="button" className="btn btn-secondary" onClick={() => msgWrite(plan.resetRoute(active.id), "routeStudio.resetDone")}>{msg("routeStudio.reset")}</button>
      </header>
      {skipped.size > 0 && <p className="route-skipped-note">{msg("routeStudio.skippedCount", { count: skipped.size })}</p>}
      <ol className="route-editor-list">
        {allSteps.map((step, index) => {
          const isSkipped = skipped.has(step.id);
          const canSkip = step.kind !== "lesson" || openLessons > 1 || isSkipped;
          const complete = step.kind === "lesson" && step.exerciseIds.length > 0 && step.exerciseIds.every((id) => answered.get(step.unitId ?? "")?.has(id));
          return <li key={step.id} className={`${isSkipped ? "is-skipped" : ""}${complete ? " is-complete" : ""}`}>
            <span className="route-order">{isSkipped ? "–" : String(index + 1).padStart(2, "0")}</span>
            <span className="route-step-copy">{step.href ? <Link className="route-step-title" href={step.href}>{step.title}</Link> : <strong>{step.title}</strong>}<span className="muted small">{step.kind === "lesson" ? step.meta : msg("routeStudio.planned")}{step.optional ? ` · ${msg("routeStudio.optional")}` : ""}{complete ? ` · ${msg("path.done")}` : ""}</span></span>
            <div className="route-step-actions">
              <button type="button" className="route-icon-button" disabled={index === 0} aria-label={msg("routeStudio.moveUp", { topic: step.title })} onClick={() => msgWrite(plan.moveStep(active.id, allSteps.map((item) => item.id), index, -1), "routeStudio.saved")}>↑</button>
              <button type="button" className="route-icon-button" disabled={index === allSteps.length - 1} aria-label={msg("routeStudio.moveDown", { topic: step.title })} onClick={() => msgWrite(plan.moveStep(active.id, allSteps.map((item) => item.id), index, 1), "routeStudio.saved")}>↓</button>
              <button type="button" className="route-step-toggle" disabled={!canSkip} aria-pressed={!isSkipped} onClick={() => msgWrite(plan.toggleStep(active.id, step.id), "routeStudio.saved")}>{msg(isSkipped ? "routeStudio.restore" : "routeStudio.skip")}</button>
            </div>
          </li>;
        })}
      </ol>
      {notice && <p role="status" className="route-notice">{notice}</p>}
    </section>
    <p className="route-local-note muted small">{msg("routeStudio.localNote")}</p>
  </main>;
}
