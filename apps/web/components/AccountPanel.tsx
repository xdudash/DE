"use client";

/**
 * The account area on the "You" page. It asks /api/session what this browser is, then shows
 * the matching controls. Forms post to the auth routes, so they also work without
 * JavaScript; the strings come from the server-side catalogs (no teaching text here).
 */
import { useEffect, useState } from "react";
import { refreshBrowserSession } from "../lib/auth/browser-refresh.ts";
import { useProgress } from "../lib/progress/client";

interface SessionStatus {
  configured: boolean;
  signedIn: boolean;
  email?: string;
  saved: boolean;
  testLogin?: boolean;
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
  const { attempts, remoteIds, refresh } = useProgress();
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const eligible = attempts.filter((a) => !remoteIds.has(a.id) && !!a.response && !!a.contentVersion);
  const legacy = attempts.filter((a) => !remoteIds.has(a.id) && (!a.response || !a.contentVersion)).length;

  async function importProgress() {
    if (importing || eligible.length === 0) return;
    setImporting(true); setImportMessage("");
    try {
      const response = await fetch("/api/progress/import", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ attempts: eligible.map((a) => ({ eventId: a.id, unitId: a.unitId, exerciseId: a.exerciseId, contentVersion: a.contentVersion, response: a.response, occurredAt: new Date(a.at).toISOString() })) }),
      });
      const body = await response.json() as { imported?: number; duplicates?: number; message?: string };
      if (!response.ok) throw new Error(body.message ?? String(response.status));
      await refresh();
      setImportMessage(t("account.importDone").replace("{count}", String(body.imported ?? 0)));
    } catch {
      setImportMessage(t("account.importFailed"));
    } finally { setImporting(false); }
  }

  async function exportProgress() {
    setExportMessage("");
    try {
      const response = await fetch("/api/progress", { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      const data = { product: "DeutschGo", exportedAt: new Date().toISOString(), ...(await response.json()) };
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `deutschgo-progress-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch { setExportMessage(t("account.exportFailed")); }
  }

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("auth");
    const key = code ? labels.notices[code] : undefined;
    setNotice(key ? labels.text[key] ?? null : null);

    let alive = true;
    refreshBrowserSession()
      .then(() => fetch("/api/session", { cache: "no-store" }))
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
          {(eligible.length > 0 || legacy > 0) && <div className="account-import">
            <h3>{t("account.importTitle")}</h3>
            {eligible.length > 0 && <p className="muted small">{t("account.importBody").replace("{count}", String(eligible.length))}</p>}
            {legacy > 0 && <p className="muted small">{t("account.importLegacy").replace("{count}", String(legacy))}</p>}
            {eligible.length > 0 && <button type="button" disabled={importing} onClick={() => void importProgress()}>{importing ? t("account.importing") : t("account.importAction").replace("{count}", String(eligible.length))}</button>}
            {importMessage && <p role="status" className="small">{importMessage}</p>}
          </div>}
          <button type="button" onClick={() => void exportProgress()}>{t("account.exportAction")}</button>
          {exportMessage && <p role="status" className="small">{exportMessage}</p>}
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
          {status.testLogin && (
            <form method="post" action="/auth/test" className="signin">
              <input type="hidden" name="lang" value={lang} />
              <button type="submit">{t("account.testLogin")}</button>
              <p className="muted small">{t("account.testLoginNote")}</p>
            </form>
          )}
        </>
      )}
    </div>
  );
}
