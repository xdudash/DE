"use client";

/**
 * Says whether this browser's answers are stored in an account. It starts with the honest
 * "not saved" banner and changes only when /api/session confirms storage, so an offline
 * or failed check never claims that progress is saved.
 */
import { useEffect, useState } from "react";

export function SaveStatus({ notSavedText, savedText }: { notSavedText: string; savedText: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/session", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<{ saved: boolean }>) : null))
      .then((s) => {
        if (alive && s?.saved) setSaved(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return saved ? <p className="muted small">{savedText}</p> : <p className="banner">{notSavedText}</p>;
}
