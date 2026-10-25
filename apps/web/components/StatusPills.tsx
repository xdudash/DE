"use client";

/**
 * Streak, XP and hearts at a glance, always in reach (ADR-0014). XP and streak use shared
 * evidence; hearts remain device-local. Full labels support assistive technology.
 */
import { translator } from "@deutschgo/i18n";
import { HEARTS } from "@deutschgo/gamification";
import { Icon } from "./Icon";
import { useMotivation } from "./Motivation";

export function StatusPills({ lang }: { lang: string }) {
  const msg = translator(lang);
  const s = useMotivation();
  // Before the browser has read its answers, keep the space but show nothing misleading.
  const ready = s !== null;
  const streak = s?.streak ?? 0;
  const xp = s?.xp ?? 0;
  const hearts = s?.hearts ?? HEARTS.max;

  return (
    <ul className={`pills${ready ? "" : " pending"}`} aria-label={msg("motivation.title")}>
      <li className={`pill streak${streak > 0 ? " lit" : ""}`}>
        <Icon name="flame" size={20} />
        <span aria-hidden="true">{streak}</span>
        <span className="sr-only">{msg("motivation.streak", { days: streak })}</span>
      </li>
      <li className="pill xp">
        <Icon name="bolt" size={20} />
        <span aria-hidden="true">{xp}</span>
        <span className="sr-only">{msg("motivation.xp", { xp })}</span>
      </li>
      <li className={`pill hearts${hearts === 0 ? " empty" : ""}`}>
        <Icon name="heart" size={20} />
        <span aria-hidden="true">{hearts}</span>
        <span className="sr-only">{msg("motivation.hearts", { hearts, max: HEARTS.max })}</span>
      </li>
    </ul>
  );
}
