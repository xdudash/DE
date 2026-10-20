"use client";

/**
 * Turns the daily reminder on or off for this browser and this account (ADR-0015).
 * Permission, subscription and the server copy are all checked, and the state shown is
 * the state that actually holds: a failed step is reported, never shown as success.
 */
import { useEffect, useState } from "react";
import { looksLikeVapidPublicKey } from "../lib/push/vapid";

export interface ReminderLabels {
  lead: string;
  on: string;
  off: string;
  enable: string;
  disable: string;
  needSignIn: string;
  unsupported: string;
  blocked: string;
  notConfigured: string;
  failed: string;
}

type Status = "checking" | "unsupported" | "notConfigured" | "blocked" | "off" | "on" | "needSignIn" | "failed";

/** A VAPID public key arrives as base64url; the browser needs raw bytes. */
function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const padded = base64url.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (base64url.length % 4)) % 4);
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function supported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export function Reminders({ lang, labels }: { lang: string; labels: ReminderLabels }) {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supported()) return setStatus("unsupported");
      if (!vapidKey || !looksLikeVapidPublicKey(vapidKey)) return setStatus("notConfigured");
      if (Notification.permission === "denied") return setStatus("blocked");
      try {
        const sub = await currentSubscription();
        if (!cancelled) setStatus(sub ? "on" : "off");
      } catch {
        if (!cancelled) setStatus("off");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vapidKey]);

  async function enable() {
    if (!vapidKey || !looksLikeVapidPublicKey(vapidKey)) return setStatus("notConfigured");
    setBusy(true);
    try {
      if ((await Notification.requestPermission()) !== "granted") return setStatus("blocked");
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes(vapidKey),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), lang }),
      });
      if (res.status === 401) {
        await sub.unsubscribe();
        return setStatus("needSignIn");
      }
      if (!res.ok) {
        await sub.unsubscribe();
        return setStatus("failed");
      }
      setStatus("on");
    } catch {
      setStatus("failed");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const sub = await currentSubscription();
      if (sub) {
        const res = await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        // Remove the server copy first: if that fails, the reminder keeps the state it had.
        if (!res.ok) return setStatus("failed");
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch {
      setStatus("failed");
    } finally {
      setBusy(false);
    }
  }

  const message =
    status === "unsupported" ? labels.unsupported
    : status === "notConfigured" ? labels.notConfigured
    : status === "blocked" ? labels.blocked
    : status === "needSignIn" ? labels.needSignIn
    : status === "failed" ? labels.failed
    : status === "on" ? labels.on
    : status === "off" ? labels.off
    : "";

  const canToggle = status === "on" || status === "off" || status === "failed" || status === "needSignIn";

  return (
    <div className="reminders">
      <p className="muted small">{labels.lead}</p>
      {message && <p role="status" className={status === "on" ? "" : "banner"}>{message}</p>}
      {canToggle && status !== "on" && (
        <button type="button" className="primary" onClick={enable} disabled={busy}>{labels.enable}</button>
      )}
      {status === "on" && (
        <button type="button" onClick={disable} disabled={busy}>{labels.disable}</button>
      )}
    </div>
  );
}
