"use client";

/**
 * The language gate, which is also the app's start URL when it is installed.
 *
 * On a first visit it is a plain choice. On a later visit it leads with the
 * language this browser used last, so opening the installed app is one tap from
 * where the learner left off.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { offeredLocales, translator } from "@deutschgo/i18n";
import { readLanguage } from "../lib/device-state";

// Stable across renders: the offered set comes from the build, not from state.
const LOCALES = offeredLocales();
const CODES = LOCALES.map((l) => l.code);

export function LanguageGate() {
  const [remembered, setRemembered] = useState<string | null>(null);

  // Read after mount: the server cannot know this browser's last language.
  useEffect(() => {
    setRemembered(readLanguage(CODES));
  }, []);

  const last = remembered ? LOCALES.find((l) => l.code === remembered) : undefined;

  return (
    <div className="gate">
      <div aria-live="polite">
        {last && (
          <p>
            <Link className="cta" href={`/${last.code}`} lang={last.code} dir={last.dir}>
              {translator(last.code)("gate.continue", { language: last.nativeName })}
            </Link>
          </p>
        )}
      </div>
      <h2 className="gate-heading">{LOCALES.map((l) => translator(l.code)("app.chooseLanguage")).join(" · ")}</h2>
      <ul className="langcards">
        {LOCALES.map((l) => (
          <li key={l.code}>
            <Link href={`/${l.code}`} lang={l.code} dir={l.dir}>
              <strong>{l.nativeName}</strong>
              <span className="muted small">{translator(l.code)("app.tagline")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
