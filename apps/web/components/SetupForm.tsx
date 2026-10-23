"use client";

/**
 * The learner's plan: what they need German for and how much time they have a day.
 * The daily goal on the home screen follows the minutes. The choice is remembered in
 * this browser only, and the form says so. When the data on this device is deleted,
 * the form shows that there is no plan any more instead of the one it last saved.
 */
import { useEffect, useState, type FormEvent } from "react";
import { translator, type MessageKey } from "@deutschgo/i18n";
import { GOALS, MINUTE_CHOICES, PROGRESS_EVENT, REGIONS, readSetup, writeSetup, type Goal, type Region, type Setup } from "../lib/device-state";

const GOAL_KEY: Record<Goal, MessageKey> = {
  general: "setup.goal.general",
  everyday: "setup.goal.everyday",
  work: "setup.goal.work",
  study: "setup.goal.study",
  exam: "setup.goal.exam",
};

const REGION_KEY: Record<Region, MessageKey> = {
  standard: "setup.region.standard",
  "de-DE": "setup.region.de",
  "de-AT": "setup.region.at",
  "de-CH": "setup.region.ch",
};

export function SetupForm({ lang }: { lang: string }) {
  const msg = translator(lang);
  const [saved, setSaved] = useState<Setup | null>(null);
  const [goal, setGoal] = useState<Goal>("general");
  const [region, setRegion] = useState<Region>("standard");
  const [minutes, setMinutes] = useState<number>(10);
  const [status, setStatus] = useState<"idle" | "saved" | "failed">("idle");

  // Read after mount so server and client render the same first frame; read again when
  // this device's data changes (for example after "delete my data").
  useEffect(() => {
    const read = () => {
      const previous = readSetup();
      setSaved(previous);
      if (previous) {
        setGoal(previous.goal);
        setRegion(previous.region);
        setMinutes(previous.minutes);
      }
    };
    read();
    window.addEventListener(PROGRESS_EVENT, read);
    return () => window.removeEventListener(PROGRESS_EVENT, read);
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Setup = { goal, region, minutes };
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
          <div className="choice-row">
            {GOALS.map((g) => (
              <label key={g} className={`choice ${goal === g ? "selected" : ""}`}>
                <input type="radio" name="goal" value={g} checked={goal === g} onChange={() => setGoal(g)} />
                <span>{msg(GOAL_KEY[g])}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="choices">
          <legend>{msg("setup.regionLabel")}</legend>
          <div className="choice-row">
            {REGIONS.map((r) => (
              <label key={r} className={`choice ${region === r ? "selected" : ""}`}>
                <input type="radio" name="region" value={r} checked={region === r} onChange={() => setRegion(r)} />
                <span>{msg(REGION_KEY[r])}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="choices">
          <legend>{msg("setup.minutesLabel")}</legend>
          <div className="choice-row">
            {MINUTE_CHOICES.map((m) => (
              <label key={m} className={`choice ${minutes === m ? "selected" : ""}`}>
                <input type="radio" name="minutes" value={m} checked={minutes === m} onChange={() => setMinutes(m)} />
                <span>{msg("setup.minutes", { minutes: m })}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="primary">{msg("setup.save")}</button>
      </form>

      <div aria-live="polite" className="setup-status">
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
        {status !== "failed" && !saved && <p className="small muted">{msg("profile.planNone")}</p>}
      </div>
    </div>
  );
}
