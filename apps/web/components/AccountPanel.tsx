"use client";

/**
 * The account area on the "You" page. It asks /api/session what this browser is, then shows
 * the matching controls. Forms post to the auth routes, so they also work without
 * JavaScript; the strings come from the server-side catalogs (no teaching text here).
 */
import { useEffect, useState } from "react";

interface SessionStatus {
  configured: boolean;
  signedIn: boolean;
  email?: string;
  saved: boolean;
}

export interface AccountLabels {
  /** Catalog strings by key, e.g. "account.google". */
  text: Record<string, string>;
  /** Maps the ?auth= notice in the URL to its catalog key. */
  notices: Record<string, string>;
}

export function AccountPanel({ lang, labels }: { lang: string; labels: AccountLabels }) {
  const t = (key: string) => labels.text[key] ?? key;
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("auth");
    const key = code ? labels.notices[code] : undefined;
    setNotice(key ? labels.text[key] ?? null : null);

    let alive = true;
    fetch("/api/session", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<SessionStatus>) : Promise.reject(new Error(String(res.status)))))
      .then((s) => {
        if (alive) setStatus(s);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [labels]);

  if (failed) return <p className="muted">{t("account.unavailable")}</p>;
  if (!status) return <p className="muted">{t("account.lead")}</p>;

  return (
    <div className="account">
      {notice && <p className="banner" role="status">{notice}</p>}
      {!status.configured && <p className="muted">{t("account.unavailable")}</p>}

      {status.configured && status.signedIn && (
        <>
          <p>
            <strong>{t("account.signedIn")}</strong>
            {status.email && <> {t("account.signedInAs").replace("{email}", status.email)}</>}
          </p>
          <p className="muted small">{status.saved ? t("account.savedNote") : t("account.notSavedNote")}</p>
          <form method="post" action="/auth/sign-out">
            <input type="hidden" name="lang" value={lang} />
            <button type="submit">{t("account.signOut")}</button>
          </form>
          <h3>{t("account.deleteTitle")}</h3>
          <form method="post" action="/auth/delete" className="confirm">
            <input type="hidden" name="lang" value={lang} />
            <label className="check">
              <input type="checkbox" name="confirm" value="delete" required />
              <span>{t("account.deleteConfirm")}</span>
            </label>
            <button type="submit" className="danger">{t("account.delete")}</button>
          </form>
        </>
      )}

      {status.configured && !status.signedIn && (
        <>
          <p className="lead">{t("account.lead")}</p>
          <form method="get" action="/auth/start" className="signin">
            <input type="hidden" name="lang" value={lang} />
            <label className="check">
              <input type="checkbox" name="over16" value="1" required />
              <span>{t("account.age")}</span>
            </label>
            <div className="actions">
              <button type="submit" name="provider" value="google">{t("account.google")}</button>
              <button type="submit" name="provider" value="apple">{t("account.apple")}</button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
