"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { deriveConceptStates, type GraphConcept } from "@deutschgo/learning-engine";
import type { Exercise } from "@deutschgo/content-kit/types";
import { translator } from "@deutschgo/i18n";
import { useProgress } from "../lib/progress/client";
import { LessonFlow, type FlowStep } from "./LessonFlow";
import type { PlayerText } from "./ExercisePlayer";

export interface ReviewUnit {
  id: string;
  version: string;
  concepts: string[];
  exercises: Exercise[];
  text: PlayerText;
}

interface ReviewTopic {
  id: string;
  title: string;
  dueAt: number;
  attempts: number;
  question?: { exercise: Exercise; unit: Pick<ReviewUnit, "id" | "version" | "concepts">; text: PlayerText };
}

export function ReviewBoard({ lang, graph, concepts, units }: {
  lang: string;
  graph: GraphConcept[];
  concepts: { id: string; title: string }[];
  units: ReviewUnit[];
}) {
  const msg = translator(lang);
  const { attempts, status } = useProgress();
  const [now, setNow] = useState(() => Date.now());
  const [load, setLoad] = useState(5);
  const [selection, setSelection] = useState<string[] | null>(null);
  const [session, setSession] = useState<FlowStep[] | null>(null);

  const topics = useMemo(() => {
    const states = deriveConceptStates(graph, attempts, now);
    const questionCounts = new Map<string, number>();
    for (const attempt of attempts) {
      const key = `${attempt.unitId}:${attempt.exerciseId}`;
      questionCounts.set(key, (questionCounts.get(key) ?? 0) + 1);
    }
    const conceptById = new Map(concepts.map((concept) => [concept.id, concept]));
    const candidates = units.flatMap((unit) => unit.exercises.map((exercise) => ({
      exercise,
      unit,
      seen: questionCounts.get(`${unit.id}:${exercise.id}`) ?? 0,
    })));
    return [...states.values()]
      .filter((state) => state.state === "review_due" && state.evidence.review)
      .sort((a, b) => (a.evidence.review?.dueAt ?? 0) - (b.evidence.review?.dueAt ?? 0))
      .map((state): ReviewTopic => {
        const id = state.conceptId;
        const candidate = candidates
          .filter((item) => item.exercise.concepts.includes(id))
          .sort((a, b) => a.seen - b.seen || a.exercise.difficulty - b.exercise.difficulty || a.exercise.id.localeCompare(b.exercise.id))[0];
        return {
          id,
          title: conceptById.get(id)?.title ?? id,
          dueAt: state.evidence.review!.dueAt,
          attempts: state.evidence.attempts,
          ...(candidate ? { question: { exercise: candidate.exercise, unit: candidate.unit, text: candidate.unit.text } } : {}),
        };
      });
  }, [attempts, concepts, graph, now, units]);

  const available = topics.filter((topic) => topic.question);
  const hasLearningHistory = attempts.some((attempt) => attempt.kind === "attempt");
  const defaultSelection = available.slice(0, load).map((topic) => topic.id);
  const selectedIds = new Set((selection ?? defaultSelection).filter((id) => available.some((topic) => topic.id === id)));
  const selectedTopics = available.filter((topic) => selectedIds.has(topic.id)).slice(0, load);
  const nextReviewAt = useMemo(() => {
    const states = deriveConceptStates(graph, attempts, now);
    return [...states.values()]
      .map((state) => state.evidence.review?.dueAt)
      .filter((dueAt): dueAt is number => typeof dueAt === "number" && dueAt > now)
      .sort((a, b) => a - b)[0];
  }, [attempts, graph, now]);

  function start() {
    const seen = new Set<string>();
    const steps: FlowStep[] = [];
    for (const topic of selectedTopics) {
      const question = topic.question;
      if (!question) continue;
      const id = `${question.unit.id}:${question.exercise.id}`;
      if (seen.has(id)) continue;
      seen.add(id);
      steps.push({
        kind: "exercise",
        id: `review-${topic.id}-${question.exercise.id}`,
        exercise: question.exercise,
        caption: msg("review.sessionCaption"),
        sourceUnit: question.unit,
        sourceText: question.text,
      });
    }
    setNow(Date.now());
    setSession(steps);
  }

  if (session) {
    const firstQuestion = session.find((step) => step.kind === "exercise");
    const unit = firstQuestion?.kind === "exercise" ? firstQuestion.sourceUnit : undefined;
    return <LessonFlow
      key={session.map((step) => step.id).join("|")}
      lang={lang}
      unit={{ id: unit?.id ?? "review", version: unit?.version ?? "1.0.0", concepts: unit?.concepts ?? [], title: msg("review.title"), reviewed: true }}
      steps={session}
      text={firstQuestion?.kind === "exercise" ? firstQuestion.sourceText ?? {} : {}}
      next={{ href: `/${lang}/review`, title: msg("review.returnBoard") }}
      saveNotice={{ notSaved: msg("status.noPersistence"), saved: msg("account.savedNote") }}
      forcePractice
      exit={{ href: `/${lang}/review`, label: msg("review.leave") }}
    />;
  }

  return (
    <main className="page review-page">
      <header className="review-heading">
        <div>
          <p className="eyebrow">{msg("review.eyebrow")}</p>
          <h1>{msg("review.title")}</h1>
          <p className="lead">{msg("review.lead")}</p>
        </div>
        <Link className="review-back" href={`/${lang}/practice`}>{msg("review.backToPractice")}</Link>
      </header>

      <section className="review-stats" aria-label={msg("review.summaryLabel")}>
        <div className="review-stat"><span>{msg("review.dueNow")}</span><strong>{status === "loading" ? "—" : topics.length}</strong></div>
        <div className="review-stat"><span>{msg("review.sessionSize")}</span><strong>{status === "loading" ? "—" : selectedTopics.length}</strong></div>
        <div className="review-stat"><span>{msg("review.timeEstimate")}</span><strong>{status === "loading" ? "—" : msg("review.minutes", { minutes: Math.max(1, selectedTopics.length * 2) })}</strong></div>
      </section>

      {status === "loading" ? (
        <section className="card review-empty" aria-live="polite" role="status">
          <h2>{msg("progress.loadingSource")}</h2>
          <p className="muted">{msg("review.loadingBody")}</p>
        </section>
      ) : topics.length === 0 ? (
        <section className="card review-empty" aria-live="polite">
          <span className="review-check" aria-hidden="true">✓</span>
          <h2>{msg(hasLearningHistory ? "review.allCaughtUp" : "review.firstSession")}</h2>
          <p className="muted">{msg(hasLearningHistory ? "review.emptyBody" : "review.firstSessionBody")}</p>
          {nextReviewAt && <p className="review-next">{msg("review.nextDate")} <time dateTime={new Date(nextReviewAt).toISOString()}>{new Date(nextReviewAt).toLocaleDateString(lang)}</time></p>}
          <Link className="btn btn-primary" href={hasLearningHistory ? `/${lang}/practice` : `/${lang}`}>{msg(hasLearningHistory ? "review.backToPractice" : "home.startCta")}</Link>
        </section>
      ) : (
        <div className="review-layout">
          <section className="card review-list" aria-labelledby="review-list-title">
            <div className="review-list-head">
              <div>
                <h2 id="review-list-title">{msg("review.chooseTopics")}</h2>
                <p className="muted small">{msg("review.mostOverdue", { count: topics.length })}</p>
              </div>
              <div className="review-load" role="group" aria-label={msg("review.sessionSize")}>
                {[3, 5, 10].map((value) => <button
                  key={value}
                  type="button"
                  className={`review-load-option${load === value ? " is-selected" : ""}`}
                  aria-pressed={load === value}
                  onClick={() => { setLoad(value); setSelection(null); }}
                >{value}</button>)}
              </div>
            </div>

            <ul className="review-topics">
              {topics.map((topic) => {
                const checked = selectedIds.has(topic.id);
                const date = new Date(topic.dueAt).toLocaleDateString(lang);
                return <li key={topic.id} className={!topic.question ? "is-unavailable" : undefined}>
                  <label className="review-topic">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!topic.question}
                      aria-label={msg("review.includeTopic", { topic: topic.title })}
                      onChange={() => {
                        const next = new Set(selectedIds);
                        if (next.has(topic.id)) next.delete(topic.id);
                        else if (next.size < load) next.add(topic.id);
                        setSelection([...next]);
                      }}
                    />
                    <span className="review-topic-main">
                      <strong>{topic.title}</strong>
                      <span className="muted small">{topic.question ? <>{msg("review.topicMeta", { count: topic.attempts })} · <time dateTime={new Date(topic.dueAt).toISOString()}>{date}</time></> : msg("review.noQuestion")}</span>
                    </span>
                    <span className="review-topic-arrow" aria-hidden="true">→</span>
                  </label>
                </li>;
              })}
            </ul>
            {available.length < topics.length && <p className="review-unavailable muted small">{msg("review.unavailableCount", { count: topics.length - available.length })}</p>}
          </section>

          <aside className="review-aside">
            <section className="card review-session-card">
              <p className="eyebrow">{msg("review.today")}</p>
              <h2>{msg("review.sessionTitle", { count: selectedTopics.length })}</h2>
              <p className="muted">{msg("review.sessionLogic")}</p>
              <button className="btn btn-primary btn-block" type="button" onClick={start} disabled={selectedTopics.length === 0}>
                {msg("review.start")}
              </button>
            </section>
            <section className="review-method">
              <span className="review-method-mark" aria-hidden="true">↻</span>
              <div><strong>{msg("review.methodTitle")}</strong><p>{msg("review.methodBody")}</p></div>
            </section>
            <p className="review-data-note">{msg(status === "account" ? "progress.accountSource" : "progress.deviceSource")}</p>
          </aside>
        </div>
      )}
    </main>
  );
}
