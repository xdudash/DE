"use client";

/**
 * Knowledge map: every topic with its prerequisites and this browser's state for it,
 * plus a search box. States come from the learning engine; planned topics are shown
 * as planned, never as practised.
 */
import { useEffect, useMemo, useState } from "react";
import { deriveConceptStates, type ConceptState, type GraphConcept } from "@deutschgo/learning-engine";
import { translator, type MessageKey } from "@deutschgo/i18n";
import { readAttempts } from "../lib/device-state";

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
  const [states, setStates] = useState<Record<string, ConceptState>>({});

  // Computed after mount: the server cannot read this browser's attempts.
  useEffect(() => {
    const derived = deriveConceptStates(graph, readAttempts(), Date.now());
    setStates(Object.fromEntries([...derived].map(([id, s]) => [id, s.state])));
  }, [graph]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => i.title.toLowerCase().includes(q)) : items;
  }, [items, query]);

  return (
    <div className="map">
      <label className="search">
        <span>{msg("map.search")}</span>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <p className="muted small">{msg("map.onDevice")}</p>
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
