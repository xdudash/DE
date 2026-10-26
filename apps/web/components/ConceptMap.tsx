"use client";

/**
 * Knowledge map: every topic with its prerequisites and the shared account/device state for it,
 * plus a search box. States come from the learning engine; planned topics are shown
 * as planned, never as practised.
 */
import Link from "next/link";
import { useMemo, useState } from "react";
import { deriveConceptStates, type ConceptState, type GraphConcept } from "@deutschgo/learning-engine";
import { translator, type MessageKey } from "@deutschgo/i18n";
import { useProgress } from "../lib/progress/client";

export interface MapItem {
  id: string;
  title: string;
  level: string;
  planned: boolean;
  category: string;
  href: string;
  startable: boolean;
  prerequisites: { id: string; title: string; href: string }[];
}

const STATE_KEY: Record<ConceptState, MessageKey> = {
  unseen: "state.unseen",
  available: "state.available",
  in_progress: "state.in_progress",
  needs_practice: "state.needs_practice",
  review_due: "state.review_due",
  provisionally_mastered: "state.provisionally_mastered",
};

interface Props {
  lang: string;
  items: MapItem[];
  graph: GraphConcept[];
}

export function ConceptMap({ lang, items, graph }: Props) {
  const msg = translator(lang);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { attempts, status } = useProgress();
  const states = useMemo(() => {
    const derived = deriveConceptStates(graph, attempts, Date.now());
    return Object.fromEntries([...derived].map(([id, s]) => [id, s.state]));
  }, [graph, attempts]);

  const levels = useMemo(() => [...new Set(items.map((item) => item.level))].sort(), [items]);
  const categories = useMemo(() => [...new Set(items.map((item) => item.category))].sort(), [items]);
  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const graphById = useMemo(() => new Map(graph.map((concept) => [concept.id, concept])), [graph]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const catchUpSteps = (targetId: string): MapItem[] => {
    const visited = new Set<string>();
    const steps: MapItem[] = [];
    const visit = (conceptId: string) => {
      if (visited.has(conceptId)) return;
      visited.add(conceptId);
      if (conceptId === targetId) return;
      const item = itemById.get(conceptId);
      const state = states[conceptId];
      const ready = state === "in_progress" || state === "review_due" || state === "provisionally_mastered";
      if (item && !item.planned && ready) return;
      const concept = graphById.get(conceptId);
      for (const dependency of concept?.dependsOn ?? []) visit(dependency);
      if (item && (!ready || item.planned)) steps.push(item);
    };
    for (const dependency of graphById.get(targetId)?.dependsOn ?? []) visit(dependency);
    return steps;
  };
  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(lang);
    return items.filter((item) => {
      if (levelFilter !== "all" && item.level !== levelFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (q && !item.title.toLocaleLowerCase(lang).includes(q)) return false;
      if (stateFilter === "planned") return item.planned;
      if (item.planned) return stateFilter === "all";
      return stateFilter === "all" || states[item.id] === stateFilter;
    });
  }, [items, query, levelFilter, stateFilter, categoryFilter, states, lang]);

  return (
    <div className="map">
      <label className="search">
        <span>{msg("map.search")}</span>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <div className="map-filter-row">
        <label className="map-filter"><span>{msg("map.levelFilter")}</span><select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}><option value="all">{msg("map.allLevels")}</option>{levels.map((level) => <option key={level} value={level}>{level}</option>)}</select></label>
        <label className="map-filter"><span>{msg("map.categoryFilter")}</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">{msg("map.allCategories")}</option>{categories.map((category) => <option key={category} value={category}>{msg(category === "grammar" ? "map.grammarCategory" : category === "words" ? "map.wordsCategory" : "map.otherCategory")}</option>)}</select></label>
        <label className="map-filter"><span>{msg("map.stateFilter")}</span><select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}><option value="all">{msg("map.allTopics")}</option><option value="planned">{msg("map.plannedFilter")}</option>{(["unseen", "available", "in_progress", "needs_practice", "review_due", "provisionally_mastered"] as ConceptState[]).map((state) => <option key={state} value={state}>{msg(STATE_KEY[state])}</option>)}</select></label>
      </div>
      <p className="muted small">{msg(status === "account" ? "map.account" : "map.onDevice")}</p>
      {visible.length === 0 && <p>{msg("map.noMatch")}</p>}
      <ul className="topics">
        {visible.map((item) => {
          const state = states[item.id];
          const catchUp = status !== "loading" && !item.planned ? catchUpSteps(item.id) : [];
          const firstStep = catchUp[0];
          return (
            <li key={item.id} id={item.id} className={item.planned ? "step planned" : "step"}>
              <strong><Link href={item.href}>{item.title}</Link></strong>{" "}
              <span className="tag">{item.level}</span>{" "}
              {item.planned ? (
                <span className="tag">{msg("catalog.plannedConcept")}</span>
              ) : (
                state && <span className="tag">{msg(STATE_KEY[state])}</span>
              )}
              {item.prerequisites.length > 0 && (
                <div className="step-meta">{msg("catalog.prerequisites")}: {item.prerequisites.map((prerequisite, index) => <span key={prerequisite.id}>{index > 0 ? ", " : ""}<Link href={prerequisite.href}>{prerequisite.title}</Link></span>)}</div>
              )}
              {catchUp.length > 0 && <div className="catchup-area">
                <button type="button" className="text-button catchup-toggle" aria-expanded={expandedId === item.id} aria-controls={`catchup-${item.id}`} onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>{msg("map.catchup", { count: catchUp.length })}</button>
                {expandedId === item.id && <section className="catchup-panel" id={`catchup-${item.id}`} aria-label={msg("map.catchupPath", { topic: item.title })}>
                  <p>{msg("map.catchupLead", { topic: item.title })}</p>
                  <ol>{catchUp.map((step, index) => <li key={step.id}>
                    <span className="catchup-number">{index + 1}</span>
                    {step.startable ? <Link href={step.href}>{step.title}</Link> : <strong>{step.title}</strong>}
                    <span className="tag">{step.planned ? msg("catalog.plannedConcept") : step.level}</span>
                  </li>)}</ol>
                  {firstStep?.startable ? <Link className="btn btn-primary" href={firstStep.href}>{msg("map.catchupStart", { topic: firstStep.title })}</Link> : <p className="catchup-blocked">{msg("map.catchupBlocked")}</p>}
                </section>}
              </div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
