"use client";

/**
 * Topics the engine says are worth practising now: reviews that have come due, and
 * topics answered wrongly often enough to count as weak. Both come from the shared
 * account/device evidence, so an empty list means the learner has not answered yet — and
 * says so, instead of inventing something to do.
 */
import { useMemo } from "react";
import Link from "next/link";
import { deriveConceptStates, type ConceptState, type GraphConcept } from "@deutschgo/learning-engine";
import { translator } from "@deutschgo/i18n";
import { useProgress } from "../lib/progress/client";
import { Icon } from "./Icon";
import type { MissionSummary } from "../lib/missions";

export interface TargetLink {
  title: string;
  href: string;
}

interface Props {
  lang: string;
  graph: GraphConcept[];
  targets: Record<string, TargetLink>;
  missions?: MissionSummary[];
}

export function PracticeList({ lang, graph, targets, missions = [] }: Props) {
  const msg = translator(lang);
  const { attempts } = useProgress();
  const groups = useMemo(() => {
    const states = deriveConceptStates(graph, attempts, Date.now());
    const pick = (state: ConceptState) =>
      [...states.values()]
        .filter((s) => s.state === state)
        // Most overdue first for reviews; most recently active first for weak topics.
        .sort((a, b) =>
          state === "review_due"
            ? (a.evidence.review?.dueAt ?? 0) - (b.evidence.review?.dueAt ?? 0)
            : (b.evidence.lastActivityAt ?? 0) - (a.evidence.lastActivityAt ?? 0),
        )
        .map((s) => s.conceptId);
    return { review_due: pick("review_due"), needs_practice: pick("needs_practice") };
  }, [graph, attempts]);

  const empty = groups !== null && groups.review_due.length === 0 && groups.needs_practice.length === 0;

  return (
    <div aria-live="polite">
      {groups.review_due.length > 0 && <section className="card review-entry">
        <div><h2>{msg("review.dueNow")}: {groups.review_due.length}</h2><p className="muted">{msg("review.practiceLead")}</p></div>
        <Link className="btn btn-primary" href={`/${lang}/review`}>{msg("review.start")}</Link>
      </section>}
      {missions.length > 0 && <section className="practice-group missions">
        <h2>{msg("mission.title")}</h2>
        <p className="muted">{msg("mission.lead")}</p>
        <ul className="topics">{missions.map((mission) => <li key={mission.unitId}>
          <Link href={`/${lang}/mission/${mission.unitId}`}><strong>{mission.title}</strong></Link>
          <p className="muted small">{mission.summary} · {msg("mission.turns", { count: mission.exerciseCount })}</p>
        </li>)}</ul>
      </section>}
      {empty && (
        <div className="card empty-state">
          <span className="empty-icon" aria-hidden="true">
            <Icon name="practice" size={34} />
          </span>
          <p className="empty-title">{msg("practice.empty")}</p>
          <p className="muted">{msg("practice.whenDue")}</p>
          <Link className="btn btn-primary" href={`/${lang}`}>{msg("done.home")}</Link>
        </div>
      )}
      {
        (["review_due", "needs_practice"] as const).map((group) =>
          groups[group].length === 0 ? null : (
            <section key={group} className="practice-group">
              <h2>{msg(group === "review_due" ? "practice.due" : "practice.weak")}</h2>
              <ul className="topics">
                {groups[group].map((id) => {
                  const target = targets[id];
                  return (
                    <li key={id}>
                      {target ? <Link href={target.href}>{target.title}</Link> : <span>{id}</span>}
                    </li>
                  );
                })}
              </ul>
            </section>
          ),
        )}
    </div>
  );
}
