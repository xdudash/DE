"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { deriveConceptStates, type GraphConcept, type Skill } from "@deutschgo/learning-engine";
import { translator } from "@deutschgo/i18n";
import { useProgress } from "../lib/progress/client";

type SkillFilter = "all" | Skill;
type ConceptKind = "grammar" | "morphology" | "lexeme_sense" | "collocation" | "pronunciation" | "orthography" | "pragmatics" | "discourse" | "regional";
type ProgressConcept = { id: string; title: string; kind: ConceptKind; href: string; dependencies: string[] };
type ProgressUnit = { id: string; title: string };
const SKILLS: Skill[] = ["knowledge", "reading", "listening", "writing", "speaking"];

export function ProgressBreakdown({ lang, concepts, units }: { lang: string; concepts: ProgressConcept[]; units: ProgressUnit[] }) {
  const msg = translator(lang);
  const { attempts } = useProgress();
  const [skill, setSkill] = useState<SkillFilter>("all");
  const graph: GraphConcept[] = useMemo(() => concepts.map(({ id, dependencies }) => ({ id, dependsOn: dependencies })), [concepts]);
  const model = useMemo(() => {
    const visibleAttempts = skill === "all" ? attempts : attempts.filter((attempt) => attempt.skill === skill);
    const totals = new Map<Skill, { answers: number; correct: number }>(SKILLS.map((item) => [item, { answers: 0, correct: 0 }]));
    const byConcept = new Map<string, typeof visibleAttempts>();
    for (const attempt of visibleAttempts) {
      const summary = totals.get(attempt.skill);
      if (summary) { summary.answers += 1; if (attempt.correct) summary.correct += 1; }
      for (const id of attempt.conceptIds) byConcept.set(id, [...(byConcept.get(id) ?? []), attempt]);
    }
    const states = deriveConceptStates(graph, visibleAttempts, Date.now());
    const rows = concepts.flatMap((concept) => {
      const evidence = byConcept.get(concept.id) ?? [];
      if (evidence.length === 0) return [];
      const correct = evidence.filter((attempt) => attempt.correct).length;
      return [{ concept, evidence: [...evidence].sort((a, b) => b.at - a.at), correct, accuracy: Math.round(correct / evidence.length * 100), state: states.get(concept.id)?.state ?? "unseen" }];
    }).sort((a, b) => b.evidence.length - a.evidence.length || a.concept.title.localeCompare(b.concept.title, lang));
    return { totals, rows };
  }, [attempts, concepts, graph, lang, skill]);
  const countLabel = (count: number) => msg("progress.breakdownAnswers", { count });

  return <section className="card progress-breakdown" aria-labelledby="progress-breakdown-title">
    <h2 className="card-title" id="progress-breakdown-title">{msg("progress.breakdownTitle")}</h2>
    <p className="muted small">{msg("progress.breakdownLead")}</p>
    <div className="progress-skill-filters" role="group" aria-label={msg("progress.filterSkills")}>
      <button type="button" className={skill === "all" ? "btn" : "btn btn-secondary"} aria-pressed={skill === "all"} onClick={() => setSkill("all")}>{msg("progress.skillAll")}</button>
      {SKILLS.map((item) => <button type="button" key={item} className={skill === item ? "btn" : "btn btn-secondary"} aria-pressed={skill === item} onClick={() => setSkill(item)}>{msg(`progress.skill.${item}`)}</button>)}
    </div>
    <ul className="progress-skill-summary">
      {(skill === "all" ? SKILLS : [skill]).map((item) => {
        const summary = model.totals.get(item)!;
        return <li key={item}><span>{msg(`progress.skill.${item}`)}</span><strong>{summary.answers ? `${Math.round(summary.correct / summary.answers * 100)}%` : "—"}</strong><span className="muted small">{countLabel(summary.answers)}</span></li>;
      })}
    </ul>
    {model.rows.length === 0 ? <p className="muted">{msg("progress.breakdownEmpty")}</p> : <div className="progress-topic-list">
      <h3>{msg("progress.topicEvidence")}</h3>
      {model.rows.map(({ concept, evidence, correct, accuracy, state }) => <details className="progress-topic" key={concept.id}>
        <summary><span className="progress-topic-name">{concept.title}</span><span className="progress-topic-stats">{accuracy}% · {countLabel(evidence.length)}</span></summary>
        <div className="progress-topic-detail">
          <p>{msg("progress.topicResult", { correct, total: evidence.length })} · {msg(`state.${state}`)} · {msg(`progress.kind.${concept.kind}`)}</p>
          <p className="muted small">{msg("progress.answersHistory")}</p>
          <ol>{evidence.map((attempt) => {
            const unit = units.find((candidate) => candidate.id === attempt.contentId);
            return <li key={attempt.id}>
              <span className={attempt.correct ? "evidence-result is-correct" : "evidence-result is-wrong"}>{msg(attempt.correct ? "progress.answerCorrect" : "progress.answerWrong")}</span>
              <time dateTime={new Date(attempt.at).toISOString()}>{new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeStyle: "short" }).format(attempt.at)}</time>
              {unit && <Link href={`/${lang}/learn/${unit.id}`}>{unit.title}</Link>}
            </li>;
          })}</ol>
          <Link className="text-button" href={concept.href}>{msg("progress.openOnMap")}</Link>
        </div>
      </details>)}
    </div>}
  </section>;
}
