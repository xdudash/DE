"use client";

/**
 * Says when the browser has no connection, because the app keeps working from its
 * cache and the learner would otherwise not know why nothing new loads.
 */
import { useEffect, useState } from "react";
import { translator } from "@deutschgo/i18n";

export function OfflineNotice({ lang }: { lang: string }) {
  const msg = translator(lang);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <p className="offlinebar" role="status">{msg("offline.indicator")}</p>
  );
}
