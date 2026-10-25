"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { translator, type MessageKey } from "@deutschgo/i18n";
import { GOALS, MINUTE_CHOICES, readSetup, writeSetup, type Goal, type Setup } from "../lib/device-state";
import { useRoutePlan, type RoutePlanOption } from "../lib/route-plan-client";

const GOAL_KEYS = {
  general: "setup.goal.general",
  everyday: "setup.goal.everyday",
  work: "setup.goal.work",
  study: "setup.goal.study",
  exam: "setup.goal.exam",
} as const;
const GOAL_HINT_KEYS: Record<Goal, MessageKey> = {
  general: "onboarding.goal.general",
  everyday: "onboarding.goal.everyday",
  work: "onboarding.goal.work",
  study: "onboarding.goal.study",
  exam: "onboarding.goal.exam",
};

export function OnboardingWizard({ lang, routes, defaultRouteId }: { lang: string; routes: RoutePlanOption[]; defaultRouteId: string }) {
  const msg = translator(lang);
  const router = useRouter();
  const routePlan = useRoutePlan(routes, defaultRouteId);
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal>("general");
  const [minutes, setMinutes] = useState<number>(10);
  const [routeId, setRouteId] = useState(defaultRouteId);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "failed">("idle");

  useEffect(() => {
    const existing = readSetup();
    if (existing) {
      setGoal(existing.goal);
      setMinutes(existing.minutes);
    }
    if (routePlan.activeRouteId) setRouteId(routePlan.activeRouteId);
    setReady(true);
  }, [routePlan.activeRouteId]);

  const chosenRoute = routes.find((route) => route.id === routeId) ?? routes[0];

  function save() {
    const setup: Setup = { goal, minutes };
    const setupSaved = writeSetup(setup);
    const routeSaved = routePlan.selectRoute(routeId);
    if (setupSaved && routeSaved) {
      setStatus("saved");
      setTimeout(() => router.push(`/${lang}`), 250);
    } else {
      setStatus("failed");
    }
  }

  return (
    <main className="page onboarding-page">
      <header className="onboarding-heading">
        <p className="eyebrow">{msg("onboarding.kicker")}</p>
        <h1>{msg("onboarding.title")}</h1>
        <p className="lead">{msg("onboarding.lead")}</p>
      </header>
      <ol className="onboarding-progress" aria-label={msg("onboarding.title")}>
        {(["onboarding.step1", "onboarding.step2", "onboarding.step3"] as const).map((key, index) => (
          <li key={key} className={index === step ? "is-current" : index < step ? "is-done" : ""} aria-current={index === step ? "step" : undefined}>
            <span>{index < step ? "✓" : index + 1}</span><b>{msg(key)}</b>
          </li>
        ))}
      </ol>

      {!ready ? <section className="card onboarding-panel" aria-busy="true"><p className="muted">…</p></section> : (
        <section className="card onboarding-panel" aria-live="polite">
          {step === 0 && <>
            <h2>{msg("setup.goalLabel")}</h2>
            <p className="muted">{msg("onboarding.goalHint")}</p>
            <div className="onboarding-goals" role="group" aria-label={msg("setup.goalLabel")}>
              {GOALS.map((value) => <button key={value} type="button" className={`onboarding-choice${goal === value ? " selected" : ""}`} aria-pressed={goal === value} onClick={() => setGoal(value)}>
                <span className="onboarding-choice-icon" aria-hidden="true">{value === "work" ? "▤" : value === "study" ? "✎" : value === "exam" ? "◎" : value === "everyday" ? "⌂" : "✦"}</span>
                <span><strong>{msg(GOAL_KEYS[value])}</strong><small>{msg(GOAL_HINT_KEYS[value])}</small></span>
                <span className="onboarding-check" aria-hidden="true">{goal === value ? "✓" : ""}</span>
              </button>)}
            </div>
            <fieldset className="onboarding-minutes">
              <legend>{msg("setup.minutesLabel")}</legend>
              <p className="muted small">{msg("onboarding.minutesHint")}</p>
              <div role="group" aria-label={msg("setup.minutesLabel")}>
                {MINUTE_CHOICES.map((value) => <button key={value} type="button" className={`onboarding-time${minutes === value ? " selected" : ""}`} aria-pressed={minutes === value} onClick={() => setMinutes(value)}>{msg("setup.minutes", { minutes: value })}</button>)}
              </div>
            </fieldset>
          </>}

          {step === 1 && <>
            <h2>{msg("routeStudio.availableRoutes")}</h2>
            <p className="muted">{msg("onboarding.routeHint")}</p>
            <div className="onboarding-routes" role="radiogroup" aria-label={msg("routeStudio.availableRoutes")}>
              {routes.map((route) => <button key={route.id} type="button" role="radio" aria-checked={routeId === route.id} className={`onboarding-route${routeId === route.id ? " selected" : ""}`} onClick={() => setRouteId(route.id)}>
                <span className="onboarding-route-mark" aria-hidden="true">{routeId === route.id ? "✓" : ""}</span>
                <span className="onboarding-route-body"><strong>{route.title}</strong><small>{route.summary}</small><span className="onboarding-route-meta">{route.from} → {route.to} · {msg("routeStudio.stepsCount", { count: route.steps.length })}</span></span>
              </button>)}
            </div>
            <p className="onboarding-local-note">{msg("routeStudio.localNote")}</p>
          </>}

          {step === 2 && <>
            <div className="onboarding-ready-icon" aria-hidden="true">✦</div>
            <h2>{msg("onboarding.reviewTitle")}</h2>
            <p className="muted">{msg("onboarding.reviewLead")}</p>
            <dl className="onboarding-summary">
              <div><dt>{msg("setup.goalLabel")}</dt><dd>{msg(GOAL_KEYS[goal])}</dd></div>
              <div><dt>{msg("setup.minutesLabel")}</dt><dd>{msg("setup.minutes", { minutes })}</dd></div>
              <div><dt>{msg("routeStudio.activeRoute")}</dt><dd>{chosenRoute?.title ?? "—"}</dd></div>
            </dl>
            {status === "failed" && <p role="alert" className="banner">{msg("onboarding.storageError")}</p>}
            {status === "saved" && <p role="status" className="onboarding-saved">{msg("onboarding.saved")}</p>}
          </>}

          <div className="onboarding-actions">
            {step > 0 ? <button type="button" className="btn btn-secondary" onClick={() => { setStatus("idle"); setStep(step - 1); }}>← {msg("onboarding.back")}</button> : <span />}
            {step < 2 ? <button type="button" className="btn btn-primary" onClick={() => { setStatus("idle"); setStep(step + 1); }}>{msg("onboarding.next")} →</button> : <div className="onboarding-final-actions"><button type="button" className="btn btn-secondary" onClick={() => router.push(`/${lang}/routes`)}>{msg("onboarding.editRoute")}</button><button type="button" className="btn btn-primary" onClick={save}>{msg("onboarding.save")}</button></div>}
          </div>
          {step === 2 && <Link className="onboarding-skip" href={`/${lang}`}>{msg("onboarding.skip")}</Link>}
        </section>
      )}
    </main>
  );
}
