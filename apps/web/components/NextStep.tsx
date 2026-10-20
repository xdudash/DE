"use client";

/**
 * Explainable next steps from the learning engine: what to do now, and why. The
 * engine reads this browser's attempts; the server supplies the route, the concept
 * graph and the titles/links for every target.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  deriveConceptStates,
  recommend,
  type GraphConcept,
  type ReasonCode,
  type Recommendation,
  type RouteStep,
} from "@deutschgo/learning-engine";
import { translator, type MessageKey } from "@deutschgo/i18n";
import { readAttempts } from "../lib/device-state";

export interface TargetLink {
  title: string;
  href: string;
}

const REASON_KEY: Record<ReasonCode, MessageKey> = {
  requested: "reason.requested",
  prerequisite_of: "reason.prerequisite_of",
  review_due: "reason.review_due",
  frequent_error: "reason.frequent_error",
  route_next: "reason.route_next",
};

interface Props {
  lang: string;
  graph: GraphConcept[];
  route: RouteStep[];
  targets: Record<string, TargetLink>;
  limit?: number;
}

export function NextStep({ lang, graph, route, targets, limit = 3 }: Props) {
  const msg = translator(lang);
  const [items, setItems] = useState<Recommendation[] | null>(null);

  // Computed after mount: the server cannot read this browser's attempts.
  useEffect(() => {
    const states = deriveConceptStates(graph, readAttempts(), Date.now());
    setItems(recommend({ graph, states, route, reviewBudget: 3, limit }));
  }, [graph, route, limit]);

  return (
    <section className="next-step" aria-labelledby="next-step-heading">
      <h2 id="next-step-heading">{msg("home.nextStep")}</h2>
      <div aria-live="polite">
        {items === null && <p className="muted">…</p>}
        {items !== null && items.length === 0 && <p className="muted">{msg("home.nextEmpty")}</p>}
        {items !== null && items.length > 0 && (
          <ol className="next-list">
            {items.map((item) => {
              const target = targets[item.target];
              const reasonTopic = item.reasonRef ? targets[item.reasonRef]?.title ?? item.reasonRef : "";
              return (
                <li key={item.target}>
                  {target ? <Link href={target.href}>{target.title}</Link> : <span>{item.target}</span>}{" "}
                  <span className="tag">{msg(REASON_KEY[item.reason], { topic: reasonTopic })}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
