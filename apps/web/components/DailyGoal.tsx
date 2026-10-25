"use client";

/**
 * Today's goal: answers recorded today across available device/account evidence against the plan (one answer per
 * planned minute; 10 when no plan is set). The ring fills; the sentence says the same
 * thing in words for everyone who does not read rings.
 */
import Link from "next/link";
import { translator } from "@deutschgo/i18n";
import { dayKey } from "@deutschgo/gamification";
import { readSetup } from "../lib/device-state";
import { useProgress } from "../lib/progress/client";

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
  const { attempts, status } = useProgress();
  const tz = zone();
  const key = dayKey(Date.now(), tz);
  const today = { answered: attempts.filter((a) => dayKey(a.at, tz) === key).length, goal: readSetup()?.minutes ?? 10 };

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
        <p className="small muted footnote">{msg(status === "loading" ? "progress.loadingSource" : status === "account" ? "progress.accountSource" : "progress.deviceSource")}</p>
      </div>
    </section>
  );
}
