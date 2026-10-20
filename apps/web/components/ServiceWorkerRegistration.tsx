"use client";

/**
 * Registers the service worker that keeps already-opened pages readable offline
 * (ADR-0012). Registration is production-only: in development a cached shell
 * hides code changes and makes debugging misleading.
 *
 * A failed registration is not an error the learner needs to see; the app works
 * exactly as before without it, so the failure is logged and swallowed.
 */
import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("service worker registration failed", error);
      });
    };
    if (document.readyState === "complete") register();
    else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
