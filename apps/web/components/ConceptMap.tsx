"use client";

/**
 * Knowledge map: every topic with its prerequisites and the shared account/device state for it,
 * plus a search box. States come from the learning engine; planned topics are shown
 * as planned, never as practised.
 */
import { useMemo, useState } from "react";
import { deriveConceptStates, type ConceptState, type GraphConcept } from "@deutschgo/learning-engine";
import { translator, type MessageKey } from "@deutschgo/i18n";
import { useProgress } from "../lib/progress/client";

export interface MapItem {
  id: string;
  title: string;
  level: string;
  planned: boolean;
  prerequisites: string[];
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
  const { attempts, status } = useProgress();
  const states = useMemo(() => {
    const derived = deriveConceptStates(graph, attempts, Date.now());
    return Object.fromEntries([...derived].map(([id, s]) => [id, s.state]));
  }, [graph, attempts]);

  const levels = useMemo(() => [...new Set(items.map((item) => item.level))].sort(), [items]);
  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(lang);
    return items.filter((item) => {
      if (levelFilter !== "all" && item.level !== levelFilter) return false;
      if (q && !item.title.toLocaleLowerCase(lang).includes(q)) return false;
      if (stateFilter === "planned") return item.planned;
      if (item.planned) return stateFilter === "all";
      return stateFilter === "all" || states[item.id] === stateFilter;
    });
  }, [items, query, levelFilter, stateFilter, states, lang]);

  return (
    <div className="map">
      <label className="search">
        <span>{msg("map.search")}</span>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <div className="map-filter-row">
        <label className="map-filter"><span>{msg("map.levelFilter")}</span><select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}><option value="all">{msg("map.allLevels")}</option>{levels.map((level) => <option key={level} value={level}>{level}</option>)}</select></label>
        <label className="map-filter"><span>{msg("map.stateFilter")}</span><select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)}><option value="all">{msg("map.allTopics")}</option><option value="planned">{msg("map.plannedFilter")}</option>{(["unseen", "available", "in_progress", "needs_practice", "review_due", "provisionally_mastered"] as ConceptState[]).map((state) => <option key={state} value={state}>{msg(STATE_KEY[state])}</option>)}</select></label>
      </div>
      <p className="muted small">{msg(status === "account" ? "map.account" : "map.onDevice")}</p>
      {visible.length === 0 && <p>{msg("map.noMatch")}</p>}
      <ul className="topics">
        {visible.map((item) => {
          const state = states[item.id];
          return (
            <li key={item.id} id={item.id} className={item.planned ? "step planned" : "step"}>
              <strong>{item.title}</strong>{" "}
              <span className="tag">{item.level}</span>{" "}
              {item.planned ? (
                <span className="tag">{msg("catalog.plannedConcept")}</span>
              ) : (
                state && <span className="tag">{msg(STATE_KEY[state])}</span>
              )}
              {item.prerequisites.length > 0 && (
                <div className="step-meta">{msg("catalog.prerequisites")}: {item.prerequisites.join(", ")}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
