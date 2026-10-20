"use client";

/**
 * Everything DeutschGo knows about this learner, in one place — which today is
 * everything this browser holds, because there are no accounts yet. The panel says
 * that plainly instead of showing an empty account screen that implies one exists.
 *
 * Deleting is a real function: nothing was sent to a server, so removing it here
 * removes all of it. The confirmation is inline rather than a browser dialog.
 */
import { useEffect, useState } from "react";
import { localeInfo, translator, type MessageKey } from "@deutschgo/i18n";
import { clearDeviceData, readSetup, type Goal, type Setup } from "../lib/device-state";

const GOAL_KEY: Record<Goal, MessageKey> = {
  life: "setup.goal.life",
  work: "setup.goal.work",
  study: "setup.goal.study",
};

export function ProfilePanel({ lang }: { lang: string }) {
  const msg = translator(lang);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState<"cleared" | "failed" | null>(null);

  useEffect(() => {
    setSetup(readSetup());
    setStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  function clear() {
    const ok = clearDeviceData();
    setSetup(ok ? null : readSetup());
    setResult(ok ? "cleared" : "failed");
    setAsking(false);
  }

  return (
    <>
      <section className="panel" aria-labelledby="plan-heading">
        <h2 id="plan-heading">{msg("profile.plan")}</h2>
        <p>
          {setup
            ? msg("setup.saved", {
                goal: msg(GOAL_KEY[setup.goal]),
                minutes: msg("setup.minutes", { minutes: setup.minutes }),
              })
            : msg("profile.planNone")}
        </p>
      </section>

      <section className="panel" aria-labelledby="language-heading">
        <h2 id="language-heading">{msg("profile.language")}</h2>
        <p>{localeInfo(lang).nativeName}</p>
      </section>

      <section className="panel" aria-labelledby="app-heading">
        <h2 id="app-heading">{msg("profile.app")}</h2>
        <p>{standalone ? msg("profile.appInstalled") : msg("profile.appBrowser")}</p>
      </section>

      <section className="panel" aria-labelledby="account-heading">
        <h2 id="account-heading">{msg("profile.account")}</h2>
        <p className="banner">{msg("profile.accountNote")}</p>
      </section>

      <section className="panel" aria-labelledby="data-heading">
        <h2 id="data-heading">{msg("profile.data")}</h2>
        <p className="muted">{msg("profile.dataNote")}</p>
        {!asking && (
          <button type="button" className="danger" onClick={() => { setAsking(true); setResult(null); }}>
            {msg("profile.clear")}
          </button>
        )}
        {asking && (
          <div className="confirm">
            <p>{msg("profile.clearConfirm")}</p>
            <div className="actions">
              <button type="button" className="danger" onClick={clear}>{msg("profile.clear")}</button>
              <button type="button" onClick={() => setAsking(false)}>{msg("exercise.reset")}</button>
            </div>
          </div>
        )}
        <div aria-live="polite">
          {result === "cleared" && <p className="feedback ok">{msg("profile.cleared")}</p>}
          {result === "failed" && <p className="feedback bad">{msg("profile.clearFailed")}</p>}
        </div>
      </section>
    </>
  );
}
