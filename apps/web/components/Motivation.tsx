"use client";

/**
 * XP, level, streak and hearts for this device (ADR-0014). Every number is derived from
 * the answers stored in this browser, so the strip says so, and it never claims those
 * numbers are saved to an account.
 *
 * The derived values are recomputed when an answer is recorded, when another tab changes
 * the stored answers, and every 30 seconds so that a returning heart shows up on its own.
 */
import { useEffect, useState } from "react";
import { translator } from "@deutschgo/i18n";
import { HEARTS, minutesUntil, summarize, type Summary } from "@deutschgo/gamification";
import { PROGRESS_EVENT, readAttempts } from "../lib/device-state";

const TICK_MS = 30_000;

function timeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Derived motivation numbers for this device. Null until the browser has rendered the page. */
export function useMotivation(): Summary | null {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    const refresh = () => setSummary(summarize(readAttempts(), Date.now(), timeZone()));
    refresh();
    window.addEventListener(PROGRESS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    const timer = window.setInterval(refresh, TICK_MS);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.clearInterval(timer);
    };
  }, []);

  return summary;
}

/** Hearts left on this device and when the next one returns, for gating practice. */
export function useHearts(): { hearts: number; nextHeartAt: number | null } | null {
  const summary = useMotivation();
  return summary ? { hearts: summary.hearts, nextHeartAt: summary.nextHeartAt } : null;
}

export function MotivationStrip({ lang }: { lang: string }) {
  const msg = translator(lang);
  const s = useMotivation();

  return (
    <section className="motivation" aria-labelledby="motivation-heading">
      <h2 id="motivation-heading">{msg("motivation.title")}</h2>
      {s === null ? null : s.answers === 0 ? (
        <p className="muted">{msg("motivation.empty")}</p>
      ) : (
        <ul className="stats">
          <li>
            <strong>{msg("motivation.xp", { xp: s.xp })}</strong>
            <span>{msg("motivation.level", { level: s.level })}</span>
            <span className="small muted">{msg("motivation.toNext", { xp: s.toNext, level: s.level + 1 })}</span>
          </li>
          <li>
            <strong>{msg("motivation.streak", { days: s.streak })}</strong>
            <span className="small muted">{msg("motivation.longest", { days: s.longestStreak })}</span>
          </li>
          <li>
            <strong>{msg("motivation.hearts", { hearts: s.hearts, max: HEARTS.max })}</strong>
            {s.nextHeartAt !== null && (
              <span className="small muted">
                {msg("motivation.nextHeart", { minutes: minutesUntil(s.nextHeartAt, Date.now()) })}
              </span>
            )}
          </li>
        </ul>
      )}
      <p className="small muted">{msg("motivation.note")}</p>
    </section>
  );
}
