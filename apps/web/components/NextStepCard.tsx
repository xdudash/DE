"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { deriveConceptStates, recommend, type GraphConcept } from "@deutschgo/learning-engine";
import { translator } from "@deutschgo/i18n";
import { useProgress } from "../lib/progress/client";
import { useRoutePlan, type RoutePlanOption } from "../lib/route-plan-client";
import { LESSON_CHECKPOINT_EVENT, SETUP_EVENT, readLessonCheckpoint, readSetup, type LessonCheckpoint, type PathDifficulty } from "../lib/device-state";
import { pendingRouteRecommendations, type AnsweredByUnit } from "../lib/path";
import type { CourseRoadmapModule } from "../lib/course-paths";

interface Target { title: string; href: string }
export function NextStepCard({ lang, graph, routes, defaultRouteId, targets, courseSequences }: { lang: string; graph: GraphConcept[]; routes: RoutePlanOption[]; defaultRouteId: string; targets: Record<string, Target>; courseSequences: Record<PathDifficulty, CourseRoadmapModule[]> }) {
  const msg = translator(lang);
  const { attempts } = useProgress();
  const [checkpoint, setCheckpoint] = useState<LessonCheckpoint | null>(null);
  const [difficulty, setDifficulty] = useState<PathDifficulty>("medium");
  useEffect(() => {
    const refresh = () => setCheckpoint(readLessonCheckpoint());
    refresh();
    window.addEventListener(LESSON_CHECKPOINT_EVENT, refresh);
    return () => window.removeEventListener(LESSON_CHECKPOINT_EVENT, refresh);
  }, []);
  useEffect(() => {
    const refresh = () => setDifficulty(readSetup()?.difficulty ?? "medium");
    refresh();
    window.addEventListener(SETUP_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(SETUP_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const { activeRoute, activeRouteId, activeSteps } = useRoutePlan(routes, defaultRouteId);
  // Keep planned concepts visible on the line, but never recommend one as the
  // next action; also advance past lessons whose exercises have all been answered.
  const routeLessons = activeSteps.filter((step) => step.kind === "lesson" && step.unitId);
  const answered: AnsweredByUnit = {};
  for (const step of routeLessons) {
    answered[step.unitId!] = new Set(attempts.filter((attempt) => attempt.unitId === step.unitId).map((attempt) => attempt.exerciseId));
  }
  const route = activeRoute
    ? pendingRouteRecommendations(activeRoute.recommendation, routeLessons.map((step) => ({ id: step.id, unitId: step.unitId!, exerciseIds: step.exerciseIds })), answered)
    : [];
  const pick = useMemo(() => {
    const states = deriveConceptStates(graph, attempts, Date.now());
    return recommend({ graph, states, route, reviewBudget: 3, limit: 1 })[0];
  }, [graph, attempts, route, activeRouteId]);
  const target = pick ? targets[pick.target] : undefined;
  const why = pick ? msg(`reason.${pick.reason}` as "reason.route_next") : "";
  const actionHref = pick?.reason === "review_due" ? `/${lang}/review` : target?.href;
  const actionLabel = pick?.reason === "review_due" ? msg("review.start") : msg("path.start");
  const resumeTarget = checkpoint ? targets[checkpoint.unitId] : undefined;
  const sequence = courseSequences[difficulty];
  const courseAnswered = new Map<string, Set<string>>();
  for (const attempt of attempts) {
    if (!courseAnswered.has(attempt.unitId)) courseAnswered.set(attempt.unitId, new Set());
    courseAnswered.get(attempt.unitId)!.add(attempt.exerciseId);
  }
  const completedCourseModules = new Set(sequence.filter((module) => module.exerciseIds.length > 0 && module.exerciseIds.every((id) => courseAnswered.get(module.id)?.has(id))).map((module) => module.id));
  const nextCourseModule = sequence.find((module) => !completedCourseModules.has(module.id));
  const completedCourseCount = completedCourseModules.size;
  const resumeHref = checkpoint?.href.replace(/^\/[a-z]{2}(?=\/)/i, `/${lang}`);
  const safeResume = !!resumeTarget && !!resumeHref && new RegExp(`^/${lang}/(?:learn|mission)/[A-Za-z0-9._-]+$`).test(resumeHref);
  return <>
    {sequence.length > 0 && <section className="card next-step course-roadmap-next" aria-labelledby="home-course-next-title">
      <div><p className="eyebrow">{msg("learningPath.continueEyebrow")}</p>
        <h2 id="home-course-next-title" className="card-title">{nextCourseModule?.title ?? msg("learningPath.pathComplete")}</h2>
        <p className="muted small">{msg("learningPath.continueProgress", { completed: completedCourseCount, total: sequence.length })}</p></div>
      {nextCourseModule && <Link className="btn btn-primary" href={nextCourseModule.href}>{msg("learningPath.continueAction")} →</Link>}
    </section>}
    {safeResume && resumeTarget && resumeHref && <section className="card next-step resume-step" aria-labelledby="resume-step-title">
      <h2 id="resume-step-title" className="card-title">{msg("home.resumeTitle")}</h2>
      <p className="lead">{resumeTarget.title}</p>
      <p className="muted small">{msg("home.resumeDescription")}</p>
      <Link className="btn btn-primary" href={resumeHref}>{msg("home.resumeCta")}</Link>
    </section>}
    <section className="card next-step" aria-labelledby="next-step-title">
      <h2 id="next-step-title" className="card-title">{msg("home.nextStep")}</h2>
      {target && actionHref ? <><p className="lead">{target.title}</p><p className="muted small">{why}</p><Link className="btn btn-primary" href={actionHref}>{actionLabel}</Link></> : <p className="muted">{msg("home.nextEmpty")}</p>}
    </section>
  </>;
}
