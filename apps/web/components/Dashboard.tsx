"use client";

/**
 * The home screen as an app: one card to continue, today's goal ring, and three figures
 * (XP, day streak, hearts). Everything is read from this browser's answers, so the screen
 * says so in its footnote. No questionnaire here: the plan lives in the learner area.
 */
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { translator } from "@deutschgo/i18n";
import { dayKey, HEARTS } from "@deutschgo/gamification";
import { PROGRESS_EVENT, readAttempts, readSetup } from "../lib/device-state";
import { useMotivation } from "./Motivation";

interface Props {
  lang: string;
  /** The lesson the continue card opens; absent when there is no lesson yet. */
  start?: { href: string; title: string; summary: string; draft: boolean };
  /** Decorative sentence illustration, rendered by the server. */
  hero?: ReactNode;
  /** Honest footnote about where progress lives. */
  notice: string;
}

const RING_RADIUS = 30;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

function zone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function Dashboard({ lang, start, hero, notice }: Props) {
  const msg = translator(lang);
  const motivation = useMotivation();
  // Today's answers and the daily goal (one answer per planned minute). Read after mount.
  const [today, setToday] = useState<{ answered: number; goal: number } | null>(null);

  useEffect(() => {
    const refresh = () => {
      const tz = zone();
      const key = dayKey(Date.now(), tz);
      const answered = readAttempts().filter((a) => dayKey(a.at, tz) === key).length;
      setToday({ answered, goal: readSetup()?.minutes ?? 10 });
    };
    refresh();
    window.addEventListener(PROGRESS_EVENT, refresh);
    return () => window.removeEventListener(PROGRESS_EVENT, refresh);
  }, []);

  const answered = today?.answered ?? 0;
  const goal = today?.goal ?? 10;
  const fraction = Math.min(1, answered / goal);
  const started = (motivation?.answers ?? 0) > 0;
  const ringLabel = msg("dash.todayOf", { answered, goal });

  return (
    <div className="dash">
      <section className="today-card" aria-labelledby="today-heading">
        {hero}
        <div className="today-head">
          <div>
            <h1 id="today-heading">{start ? start.title : msg("dash.start")}</h1>
            {start && <p className="muted">{start.summary}</p>}
            {start?.draft && <span className="tag warn">{msg("status.draftTag")}</span>}
          </div>
          <div className="ring" role="img" aria-label={ringLabel}>
            <svg viewBox="0 0 72 72" aria-hidden="true">
              <circle className="track" cx="36" cy="36" r={RING_RADIUS} fill="none" strokeWidth="7" />
              <circle
                className="fill"
                cx="36"
                cy="36"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={RING_LENGTH}
                strokeDashoffset={RING_LENGTH * (1 - fraction)}
              />
            </svg>
            <span className="count" aria-hidden="true">{answered}</span>
          </div>
        </div>
        <p className="small muted ring-caption">{ringLabel}</p>
        {start && (
          <Link className="cta-big" href={start.href}>
            {started ? msg("flow.continue") : msg("dash.start")}
          </Link>
        )}
      </section>

      <ul className="stat-row">
        <li className="stat-xp">
          <strong>{motivation ? motivation.xp : "–"}</strong>
          <span>{msg("dash.xp")}</span>
        </li>
        <li className="stat-streak">
          <strong>{motivation ? motivation.streak : "–"}</strong>
          <span>{msg("dash.streak")}</span>
        </li>
        <li className="stat-hearts">
          <strong>{motivation ? `${motivation.hearts}/${HEARTS.max}` : "–"}</strong>
          <span>{msg("dash.hearts")}</span>
        </li>
      </ul>

      <p className="small muted dash-note">{notice}</p>
    </div>
  );
}
