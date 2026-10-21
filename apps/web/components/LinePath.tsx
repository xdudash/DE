"use client";

/**
 * The learning line: a route drawn as a transit line with stations. One station is
 * "you are here"; finished lessons are ticked; topics without a lesson yet are shown as
 * in preparation and are never offered as if they could be studied.
 *
 * The line comes from the content route; the states come from this browser's answers.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { translator } from "@deutschgo/i18n";
import { PROGRESS_EVENT, readLessonResults } from "../lib/device-state";
import { lineProgress, stationStates, type AnsweredByUnit, type StationKind } from "../lib/path";
import { Icon } from "./Icon";

export interface Station {
  id: string;
  title: string;
  kind: StationKind;
  unitId?: string;
  href?: string;
  /** Level and length, already formatted on the server. */
  meta?: string;
  draft?: boolean;
  exerciseIds: string[];
}

interface Props {
  lang: string;
  line: { title: string; badge: string };
  stations: Station[];
  /** Illustration for the lesson it belongs to, rendered by the server. */
  preview?: { unitId: string; node: ReactNode };
}

export function LinePath({ lang, line, stations, preview }: Props) {
  const msg = translator(lang);
  const [answered, setAnswered] = useState<AnsweredByUnit>({});
  const list = useRef<HTMLOListElement>(null);

  // Open the line where the learner is: bring "you are here" into view once, if it is not.
  useEffect(() => {
    const here = list.current?.querySelector<HTMLElement>(".station.is-current");
    if (!here) return;
    const box = here.getBoundingClientRect();
    if (box.top < 0 || box.bottom > window.innerHeight) here.scrollIntoView({ block: "center" });
  }, []);

  useEffect(() => {
    const read = () => {
      const next: Record<string, Set<string>> = {};
      for (const s of stations) if (s.unitId) next[s.unitId] = new Set(Object.keys(readLessonResults(s.unitId)));
      setAnswered(next);
    };
    read();
    window.addEventListener(PROGRESS_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, [stations]);

  const states = stationStates(stations, answered);
  const { done, total } = lineProgress(states);
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <section className="line" aria-labelledby="line-title">
      <header className="line-head">
        <span className="line-badge" aria-hidden="true">{line.badge}</span>
        <div className="line-titles">
          <h1 id="line-title">{line.title}</h1>
          <p>{msg("path.progress", { done, total })}</p>
        </div>
      </header>
      <div className="line-meter" aria-hidden="true">
        <span style={{ inlineSize: `${percent}%` }} />
      </div>

      <ol className="stations" ref={list}>
        {stations.map((s, i) => {
          const state = states[i]!;
          const started = !!s.unitId && (answered[s.unitId]?.size ?? 0) > 0;
          const reachable = !!s.href && state !== "planned";
          return (
            <li key={s.id} className={`station is-${state}`} aria-current={state === "current" ? "step" : undefined}>
              <span className="stop" aria-hidden="true">
                {state === "done" ? <Icon name="check" size={18} /> : state === "planned" ? <Icon name="lock" size={16} /> : <span className="stop-dot" />}
              </span>
              <div className="station-body">
                {reachable ? (
                  <Link className="station-name" href={s.href!}>{s.title}</Link>
                ) : (
                  <span className="station-name">{s.title}</span>
                )}
                <span className="station-meta">
                  {state === "done" && <span className="chip ok">{msg("path.done")}</span>}
                  {state === "current" && <span className="chip here">{msg("path.here")}</span>}
                  {state === "planned" && <span className="chip">{msg("path.planned")}</span>}
                  {reachable && s.meta && <span>{s.meta}</span>}
                  {reachable && s.draft && <span className="tag warn">{msg("status.draftTag")}</span>}
                </span>
                {state === "current" && reachable && (
                  <div className="station-card">
                    {preview && preview.unitId === s.unitId && preview.node}
                    <Link className="btn btn-primary btn-block" href={s.href!}>
                      {started ? msg("flow.continue") : msg("path.start")}
                    </Link>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
