"use client";

import Link from "next/link";
import { useMemo } from "react";
import { deriveConceptStates, recommend, type GraphConcept, type RouteStep } from "@deutschgo/learning-engine";
import { translator } from "@deutschgo/i18n";
import { useProgress } from "../lib/progress/client";

interface Target { title: string; href: string }
export function NextStepCard({ lang, graph, route, targets }: { lang: string; graph: GraphConcept[]; route: RouteStep[]; targets: Record<string, Target> }) {
  const msg = translator(lang);
  const { attempts } = useProgress();
  const pick = useMemo(() => {
    const states = deriveConceptStates(graph, attempts, Date.now());
    return recommend({ graph, states, route, reviewBudget: 3, limit: 1 })[0];
  }, [graph, attempts, route]);
  const target = pick ? targets[pick.target] : undefined;
  const why = pick ? msg(`reason.${pick.reason}` as "reason.route_next") : "";
  const actionHref = pick?.reason === "review_due" ? `/${lang}/review` : target?.href;
  const actionLabel = pick?.reason === "review_due" ? msg("review.start") : msg("path.start");
  return <section className="card next-step" aria-labelledby="next-step-title">
    <h2 id="next-step-title" className="card-title">{msg("home.nextStep")}</h2>
    {target && actionHref ? <><p className="lead">{target.title}</p><p className="muted small">{why}</p><Link className="btn btn-primary" href={actionHref}>{actionLabel}</Link></> : <p className="muted">{msg("home.nextEmpty")}</p>}
  </section>;
}
