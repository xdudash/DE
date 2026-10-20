"use client";

/**
 * First-visit setup: what the learner needs German for and how much time they have.
 * The choice is remembered in this browser only, and the form says so.
 */
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { translator, type MessageKey } from "@deutschgo/i18n";
import { GOALS, MINUTE_CHOICES, readSetup, writeSetup, type Goal, type Setup } from "../lib/device-state";

const GOAL_KEY: Record<Goal, MessageKey> = {
  life: "setup.goal.life",
  work: "setup.goal.work",
  study: "setup.goal.study",
};

interface Props {
  lang: string;
  startHref?: string;
  startTitle?: string;
}

export function SetupForm({ lang, startHref, startTitle }: Props) {
  const msg = translator(lang);
  const [saved, setSaved] = useState<Setup | null>(null);
  const [goal, setGoal] = useState<Goal>("life");
  const [minutes, setMinutes] = useState<number>(10);
  const [status, setStatus] = useState<"idle" | "saved" | "failed">("idle");

  // Read after mount so server and client render the same first frame.
  useEffect(() => {
    const previous = readSetup();
    if (previous) {
      setSaved(previous);
      setGoal(previous.goal);
      setMinutes(previous.minutes);
    }
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = { goal, minutes };
    if (writeSetup(next)) {
      setSaved(next);
      setStatus("saved");
    } else {
      setStatus("failed");
    }
  }

  return (
    <div className="setup">
      <form onSubmit={onSubmit} aria-label={msg("setup.goalLabel")}>
        <fieldset className="choices">
          <legend>{msg("setup.goalLabel")}</legend>
          {GOALS.map((g) => (
            <label key={g} className={`choice ${goal === g ? "selected" : ""}`}>
              <input type="radio" name="goal" value={g} checked={goal === g} onChange={() => setGoal(g)} />
              <span>{msg(GOAL_KEY[g])}</span>
            </label>
          ))}
        </fieldset>
        <fieldset className="choices">
          <legend>{msg("setup.minutesLabel")}</legend>
          {MINUTE_CHOICES.map((m) => (
            <label key={m} className={`choice ${minutes === m ? "selected" : ""}`}>
              <input type="radio" name="minutes" value={m} checked={minutes === m} onChange={() => setMinutes(m)} />
              <span>{msg("setup.minutes", { minutes: m })}</span>
            </label>
          ))}
        </fieldset>
        <button type="submit" className="primary">{msg("setup.save")}</button>
      </form>

      <div aria-live="polite">
        {status === "failed" && <p className="banner">{msg("setup.failed")}</p>}
        {status !== "failed" && saved && (
          <p className="small">
            {msg("setup.saved", {
              goal: msg(GOAL_KEY[saved.goal]),
              // Pass the localized duration ("15 min", "15 хв"), not a bare number.
              minutes: msg("setup.minutes", { minutes: saved.minutes }),
            })}{" "}
            <span className="muted">{msg("setup.deviceOnly")}</span>
          </p>
        )}
      </div>

      {startHref && startTitle && (
        <p>
          <Link className="cta" href={startHref}>{startTitle}</Link>
        </p>
      )}
    </div>
  );
}
