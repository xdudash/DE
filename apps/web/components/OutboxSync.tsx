"use client";

/**
 * Sends answers that are still waiting in this browser's outbox (lib/attempts/outbox.ts):
 * when a page opens, when the connection comes back, and once a minute while something
 * waits. Renders nothing; the lesson says when an answer is waiting.
 */
import { useEffect } from "react";
import { flushOutbox, readOutbox } from "../lib/attempts/outbox";
import { submitAttempt } from "../lib/attempts/submit";
import { deviceKeyValue } from "../lib/device-state";

const INTERVAL_MS = 60_000;

export function OutboxSync() {
  useEffect(() => {
    let busy = false;
    const flush = () => {
      if (busy || (typeof navigator !== "undefined" && navigator.onLine === false)) return;
      const store = deviceKeyValue();
      if (readOutbox(store).length === 0) return;
      busy = true;
      void flushOutbox(store, (item) => submitAttempt(item), Date.now())
        .catch(() => {})
        .finally(() => {
          busy = false;
        });
    };
    flush();
    window.addEventListener("online", flush);
    const timer = window.setInterval(flush, INTERVAL_MS);
    return () => {
      window.removeEventListener("online", flush);
      window.clearInterval(timer);
    };
  }, []);
  return null;
}
