"use client";

/**
 * Offers "install" only where the browser actually offers it.
 *
 * Chromium fires `beforeinstallprompt` when the install criteria are met; we keep
 * the event and show our own button. Browsers that never fire it (Safari, Firefox)
 * show nothing rather than instructions for a button that does not exist, and a
 * window already running standalone shows nothing either.
 */
import { useEffect, useState } from "react";
import { translator } from "@deutschgo/i18n";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt({ lang }: { lang: string }) {
  const msg = translator(lang);
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => setEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!event) return null;

  return (
    <p className="install">
      <button
        type="button"
        className="primary"
        onClick={async () => {
          const pending = event;
          // The stored event can be used once; drop it either way.
          setEvent(null);
          await pending.prompt();
        }}
      >
        {msg("pwa.install")}
      </button>{" "}
      <span className="muted small">{msg("pwa.installHint")}</span>
    </p>
  );
}
