"use client";

/**
 * XP, level, streak and hearts (ADR-0014). XP and streak use shared account/device
 * evidence; hearts remain device-local because the account event does not retain practice mode.
 *
 * The derived values are recomputed when an answer is recorded, when another tab changes
 * the stored answers, and every 30 seconds so that a returning heart shows up on its own.
 */
import { useEffect, useState } from "react";
import { translator } from "@deutschgo/i18n";
import { HEARTS, minutesUntil, summarizeScoped, type Summary } from "@deutschgo/gamification";
import { useProgress } from "../lib/progress/client";
import { Icon } from "./Icon";

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
  const { attempts } = useProgress();
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    // Hearts count practice answers only; first passes through a lesson never cost one.
    const refresh = () => setSummary(summarizeScoped(attempts, Date.now(), timeZone()));
    refresh();
    const timer = window.setInterval(refresh, TICK_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [attempts]);

  return summary;
}

/** The top of the learner's own page: who, which level, and the three motivation figures. */
export function ProfileHero({ lang }: { lang: string }) {
  const msg = translator(lang);
  const { status } = useProgress();
  const s = useMotivation();
  const span = s ? s.intoLevel + s.toNext : 1;
  const percent = s ? Math.round((s.intoLevel / span) * 100) : 0;

  return (
    <section className="card hero-card" aria-labelledby="profile-title">
      <div className="hero-top">
        <span className="avatar" aria-hidden="true">
          <Icon name="user" size={34} />
        </span>
        <div className="hero-name">
          <h1 id="profile-title">{msg("profile.title")}</h1>
          {s && <p className="level-line">{msg("motivation.level", { level: s.level })}</p>}
        </div>
      </div>

      {s === null ? null : s.answers === 0 ? (
        <p className="muted">{msg("motivation.empty")}</p>
      ) : (
        <>
          <div className="level-meter" aria-hidden="true">
            <span style={{ inlineSize: `${percent}%` }} />
          </div>
          <p className="small muted level-next">{msg("motivation.toNext", { xp: s.toNext, level: s.level + 1 })}</p>
          <ul className="figures">
            <li className="fig-xp">
              <Icon name="bolt" size={22} />
              <strong>{s.xp}</strong>
              <span>{msg("dash.xp")}</span>
            </li>
            <li className="fig-streak">
              <Icon name="flame" size={22} />
              <strong>{s.streak}</strong>
              <span>{msg("dash.streak")}</span>
            </li>
            <li className="fig-hearts">
              <Icon name="heart" size={22} />
              <strong>
                {s.hearts}/{HEARTS.max}
              </strong>
              <span>{msg("dash.hearts")}</span>
            </li>
          </ul>
          <p className="small muted">{msg("motivation.longest", { days: s.longestStreak })}</p>
          {s.nextHeartAt !== null && (
            <p className="small muted">{msg("motivation.nextHeart", { minutes: minutesUntil(s.nextHeartAt, Date.now()) })}</p>
          )}
        </>
      )}
      <p className="small muted">{msg(status === "account" ? "motivation.accountNote" : "motivation.note")}</p>
    </section>
  );
}
