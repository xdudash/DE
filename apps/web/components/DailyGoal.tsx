"use client";

/**
 * Today's goal: answers given today on this device against the plan (one answer per
 * planned minute; 10 when no plan is set). The ring fills; the sentence says the same
 * thing in words for everyone who does not read rings.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { translator } from "@deutschgo/i18n";
import { dayKey } from "@deutschgo/gamification";
import { PROGRESS_EVENT, readAttempts, readSetup } from "../lib/device-state";

const R = 30;
const LENGTH = 2 * Math.PI * R;

function zone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function DailyGoal({ lang }: { lang: string }) {
  const msg = translator(lang);
  const [today, setToday] = useState<{ answered: number; goal: number }>({ answered: 0, goal: 10 });

  useEffect(() => {
    const refresh = () => {
      const tz = zone();
      const key = dayKey(Date.now(), tz);
      setToday({
        answered: readAttempts().filter((a) => dayKey(a.at, tz) === key).length,
        goal: readSetup()?.minutes ?? 10,
      });
    };
    refresh();
    window.addEventListener(PROGRESS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const fraction = Math.min(1, today.answered / today.goal);
  const sentence = msg("dash.todayOf", { answered: today.answered, goal: today.goal });

  return (
    <section className="card goal" aria-labelledby="goal-title">
      <div className="ring" aria-hidden="true">
        <svg viewBox="0 0 72 72">
          <circle className="track" cx="36" cy="36" r={R} fill="none" strokeWidth="8" />
          <circle
            className={`fill${fraction >= 1 ? " full" : ""}`}
            cx="36"
            cy="36"
            r={R}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={LENGTH}
            strokeDashoffset={LENGTH * (1 - fraction)}
          />
        </svg>
        <span className="count">{today.answered}</span>
      </div>
      <div className="goal-text">
        <h2 id="goal-title">{msg("dash.goal")}</h2>
        <p>{sentence}</p>
        <Link href={`/${lang}/me#plan-heading`} className="goal-link">{msg("dash.plan")}</Link>
      </div>
    </section>
  );
}
