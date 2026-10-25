"use client";

/**
 * What the shared account/device evidence says about the learner's progress. Every number is derived
 * from recorded answers; nothing is estimated, and before the first answer the
 * panel says there is nothing yet rather than showing zeros as if they were a score.
 */
import { useMemo } from "react";
import { deriveConceptStates, type ConceptState, type GraphConcept } from "@deutschgo/learning-engine";
import { translator, type MessageKey } from "@deutschgo/i18n";
import { useProgress } from "../lib/progress/client";
import type { AttemptStats } from "../lib/device-state";

const STATE_KEY: Record<ConceptState, MessageKey> = {
  unseen: "state.unseen",
  available: "state.available",
  in_progress: "state.in_progress",
  needs_practice: "state.needs_practice",
  review_due: "state.review_due",
  provisionally_mastered: "state.provisionally_mastered",
};

/** States that mean the learner has actually done something with the topic. */
const STARTED: ConceptState[] = ["in_progress", "needs_practice", "review_due", "provisionally_mastered"];

interface Props {
  lang: string;
  graph: GraphConcept[];
  totalTopics: number;
}

export function ProgressPanel({ lang, graph, totalTopics }: Props) {
  const msg = translator(lang);
  const { attempts, status } = useProgress();
  const { stats, counts } = useMemo(() => {
    const exercises = new Set<string>(); const lessons = new Set<string>(); let correct = 0; let lastAt: number | null = null;
    for (const answer of attempts) { exercises.add(`${answer.unitId}/${answer.exerciseId}`); lessons.add(answer.unitId); if (answer.correct) correct += 1; if (lastAt === null || answer.at > lastAt) lastAt = answer.at; }
    const stats: AttemptStats = { answers: attempts.length, correct, accuracy: attempts.length ? correct / attempts.length : null, exercises: exercises.size, lessons: lessons.size, lastAt };
    const states = deriveConceptStates(graph, attempts, Date.now());
    const tally: Partial<Record<ConceptState, number>> = {};
    for (const s of states.values()) tally[s.state] = (tally[s.state] ?? 0) + 1;
    return { stats, counts: tally };
  }, [graph, attempts]);

  const started = STARTED.reduce((sum, state) => sum + (counts[state] ?? 0), 0);
  const percentStarted = totalTopics > 0 ? Math.round((started / totalTopics) * 100) : 0;

  return (
    <section className="card" aria-labelledby="progress-heading">
      <h2 id="progress-heading" className="card-title">{msg("progress.title")}</h2>
      <p className="muted small">{msg(status === "loading" ? "progress.loadingSource" : status === "account" ? "progress.accountSource" : "progress.deviceSource")}</p>
      <div aria-live="polite">
        {status === "loading" && stats.answers === 0 && <p className="muted">…</p>}
        {stats.answers === 0 && status !== "loading" && <p className="muted">{msg("progress.none")}</p>}
        {stats.answers > 0 && (
          <>
            <ul className="stats">
              <li>
                <strong>{started}</strong>
                <span className="muted small">{msg("progress.ofTopics", { total: totalTopics })}</span>
              </li>
              <li>
                <strong>{stats.answers}</strong>
                <span className="muted small">{msg("progress.answersLabel")}</span>
              </li>
              {stats.accuracy !== null && (
                <li>
                  <strong>{Math.round(stats.accuracy * 100)}%</strong>
                  <span className="muted small">{msg("progress.accuracyLabel")}</span>
                </li>
              )}
            </ul>
            <div
              className="statbar"
              role="progressbar"
              aria-valuenow={started}
              aria-valuemin={0}
              aria-valuemax={totalTopics}
              aria-label={msg("progress.title")}
            >
              <span style={{ inlineSize: `${percentStarted}%` }} />
            </div>
            <ul className="statelist">
              {STARTED.filter((state) => (counts[state] ?? 0) > 0).map((state) => (
                <li key={state}>
                  <span>{msg(STATE_KEY[state])}</span>
                  <strong>{counts[state]}</strong>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
