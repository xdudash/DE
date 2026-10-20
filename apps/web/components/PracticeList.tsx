"use client";

/**
 * Topics the engine says are worth practising now: reviews that have come due, and
 * topics answered wrongly often enough to count as weak. Both come from this
 * browser's answers, so an empty list means the learner has not answered yet — and
 * says so, instead of inventing something to do.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { deriveConceptStates, type ConceptState, type GraphConcept } from "@deutschgo/learning-engine";
import { translator } from "@deutschgo/i18n";
import type { TargetLink } from "./NextStep";
import { readAttempts } from "../lib/device-state";

interface Props {
  lang: string;
  graph: GraphConcept[];
  targets: Record<string, TargetLink>;
}

export function PracticeList({ lang, graph, targets }: Props) {
  const msg = translator(lang);
  const [groups, setGroups] = useState<Record<"review_due" | "needs_practice", string[]> | null>(null);

  useEffect(() => {
    const states = deriveConceptStates(graph, readAttempts(), Date.now());
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
    setGroups({ review_due: pick("review_due"), needs_practice: pick("needs_practice") });
  }, [graph]);

  const empty = groups !== null && groups.review_due.length === 0 && groups.needs_practice.length === 0;

  return (
    <div aria-live="polite">
      {groups === null && <p className="muted">…</p>}
      {empty && (
        <>
          <p>{msg("practice.empty")}</p>
          <p className="muted">{msg("practice.whenDue")}</p>
        </>
      )}
      {groups !== null &&
        (["review_due", "needs_practice"] as const).map((group) =>
          groups[group].length === 0 ? null : (
            <section key={group}>
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
