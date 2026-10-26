"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { deriveConceptStates, recommend, type GraphConcept } from "@deutschgo/learning-engine";
import { translator } from "@deutschgo/i18n";
import { useProgress } from "../lib/progress/client";
import { useRoutePlan, type RoutePlanOption } from "../lib/route-plan-client";
import { LESSON_CHECKPOINT_EVENT, readLessonCheckpoint, type LessonCheckpoint } from "../lib/device-state";
import { pendingRouteRecommendations, type AnsweredByUnit } from "../lib/path";

interface Target { title: string; href: string }
export function NextStepCard({ lang, graph, routes, defaultRouteId, targets }: { lang: string; graph: GraphConcept[]; routes: RoutePlanOption[]; defaultRouteId: string; targets: Record<string, Target> }) {
  const msg = translator(lang);
  const { attempts } = useProgress();
  const [checkpoint, setCheckpoint] = useState<LessonCheckpoint | null>(null);
  useEffect(() => {
    const refresh = () => setCheckpoint(readLessonCheckpoint());
    refresh();
    window.addEventListener(LESSON_CHECKPOINT_EVENT, refresh);
    return () => window.removeEventListener(LESSON_CHECKPOINT_EVENT, refresh);
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
  const resumeHref = checkpoint?.href.replace(/^\/[a-z]{2}(?=\/)/i, `/${lang}`);
  const safeResume = !!resumeTarget && !!resumeHref && new RegExp(`^/${lang}/(?:learn|mission)/[A-Za-z0-9._-]+$`).test(resumeHref);
  return <>
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
