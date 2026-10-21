"use client";

/**
 * The learner's settings and the data this browser holds, as cards in the profile.
 *
 * Deleting is a real function: without an account nothing was sent to a server, so
 * removing it here removes all of it. The confirmation is inline rather than a browser
 * dialog, and a refusal by the browser is reported instead of claiming success.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { offeredLocales, translator } from "@deutschgo/i18n";
import { clearDeviceData, readSound, writeSound } from "../lib/device-state";
import { Icon } from "./Icon";
import { SetupForm } from "./SetupForm";

/** Plan, explanation language and sound. */
export function ProfileSettings({ lang }: { lang: string }) {
  const msg = translator(lang);
  const [sound, setSound] = useState(true);

  useEffect(() => setSound(readSound()), []);

  return (
    <>
      <section className="card" aria-labelledby="plan-heading">
        <h2 id="plan-heading" className="card-title">
          <Icon name="calendar" size={20} />
          {msg("dash.plan")}
        </h2>
        <SetupForm lang={lang} />
      </section>

      <section className="card" aria-labelledby="language-heading">
        <h2 id="language-heading" className="card-title">
          <Icon name="globe" size={20} />
          {msg("profile.language")}
        </h2>
        <ul className="lang-list">
          {offeredLocales().map((l) => (
            <li key={l.code}>
              <Link href={`/${l.code}/me`} lang={l.code} dir={l.dir} aria-current={l.code === lang ? "true" : undefined}>
                <span>{l.nativeName}</span>
                {l.code === lang && <Icon name="check" size={18} />}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" aria-labelledby="sound-heading">
        <div className="setting-row">
          <div className="setting-text">
            <h2 id="sound-heading" className="card-title">
              <Icon name="sound" size={20} />
              {msg("profile.sound")}
            </h2>
            <p className="small muted">{msg("profile.soundNote")}</p>
          </div>
          <button
            type="button"
            role="switch"
            className="switch"
            aria-checked={sound}
            aria-labelledby="sound-heading"
            onClick={() => {
              const next = !sound;
              if (writeSound(next)) setSound(next);
            }}
          >
            <span className="knob" aria-hidden="true" />
          </button>
        </div>
      </section>
    </>
  );
}

/** Where the app runs, and the data this browser holds. */
export function ProfileDevice({ lang }: { lang: string }) {
  const msg = translator(lang);
  const [standalone, setStandalone] = useState(false);
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState<"cleared" | "failed" | null>(null);

  useEffect(() => {
    setStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  function clear() {
    const ok = clearDeviceData();
    setResult(ok ? "cleared" : "failed");
    setAsking(false);
  }

  return (
    <>
      <section className="card" aria-labelledby="app-heading">
        <h2 id="app-heading" className="card-title">
          <Icon name="phone" size={20} />
          {msg("profile.app")}
        </h2>
        <p>{standalone ? msg("profile.appInstalled") : msg("profile.appBrowser")}</p>
      </section>

      <section className="card" aria-labelledby="data-heading">
        <h2 id="data-heading" className="card-title">
          <Icon name="trash" size={20} />
          {msg("profile.data")}
        </h2>
        <p className="muted">{msg("profile.accountNote")}</p>
        <p className="muted">{msg("profile.dataNote")}</p>
        {!asking && (
          <button type="button" className="btn btn-danger" onClick={() => { setAsking(true); setResult(null); }}>
            {msg("profile.clear")}
          </button>
        )}
        {asking && (
          <div className="confirm">
            <p>{msg("profile.clearConfirm")}</p>
            <div className="actions">
              <button type="button" className="btn btn-danger" onClick={clear}>{msg("profile.clear")}</button>
              <button type="button" className="btn" onClick={() => setAsking(false)}>{msg("exercise.reset")}</button>
            </div>
          </div>
        )}
        <div aria-live="polite">
          {result === "cleared" && <p className="notice ok">{msg("profile.cleared")}</p>}
          {result === "failed" && <p className="notice bad">{msg("profile.clearFailed")}</p>}
        </div>
      </section>
    </>
  );
}
