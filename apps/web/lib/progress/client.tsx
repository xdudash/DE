"use client";

/** One live, account-aware view of learning evidence shared by every app surface. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { LearningEvent } from "@deutschgo/learning-engine";
import type { DeviceAttempt } from "../device-state";
import { ACCOUNT_PROGRESS_EVENT, PROGRESS_EVENT, readAttempts } from "../device-state";
import { refreshBrowserSession } from "../auth/browser-refresh.ts";

export type ProgressStatus = "loading" | "device" | "account" | "signed_out";
interface ProgressValue {
  attempts: DeviceAttempt[];
  remoteIds: ReadonlySet<string>;
  status: ProgressStatus;
  refresh(): Promise<void>;
}
const ProgressContext = createContext<ProgressValue | null>(null);

function asDeviceEvent(raw: LearningEvent & Record<string, unknown>): DeviceAttempt | null {
  const event = raw as LearningEvent & { id: string; at?: number; occurredAt?: string; contentId?: string; localId?: string; correct?: boolean };
  const at = typeof event.at === "number" ? event.at : Date.parse(event.occurredAt ?? "");
  if (!event.id || !Number.isFinite(at) || typeof event.localId !== "string" || typeof event.contentId !== "string" || typeof event.correct !== "boolean") return null;
  return { ...event, id: event.id, at, kind: "attempt", unitId: event.contentId, exerciseId: event.localId, contentId: event.contentId, correct: event.correct } as DeviceAttempt;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [local, setLocal] = useState<DeviceAttempt[]>([]);
  const [remote, setRemote] = useState<DeviceAttempt[]>([]);
  const [remoteIds, setRemoteIds] = useState<ReadonlySet<string>>(new Set());
  const [status, setStatus] = useState<ProgressStatus>("loading");

  const refresh = useCallback(async () => {
    setLocal(readAttempts());
    try {
      let response = await fetch("/api/progress", { cache: "no-store" });
      if (response.status === 401 && await refreshBrowserSession()) response = await fetch("/api/progress", { cache: "no-store" });
      if (response.status === 401) {
        setRemote([]); setRemoteIds(new Set()); setStatus("signed_out"); return;
      }
      if (!response.ok) throw new Error(`progress_${response.status}`);
      const body = await response.json() as { events?: unknown[] };
      const events = Array.isArray(body.events) ? body.events.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const event = asDeviceEvent(item as LearningEvent & Record<string, unknown>);
        return event ? [event] : [];
      }) : [];
      setRemote(events);
      setRemoteIds(new Set(events.map((event) => event.id)));
      setStatus("account");
    } catch {
      setStatus((current) => current === "loading" ? "device" : current);
    }
  }, []);

  useEffect(() => {
    setLocal(readAttempts());
    void refresh();
    const onLocal = () => setLocal(readAttempts());
    const onAccount = () => { void refresh(); };
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener(PROGRESS_EVENT, onLocal);
    window.addEventListener(ACCOUNT_PROGRESS_EVENT, onAccount);
    window.addEventListener("storage", onLocal);
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, onLocal);
      window.removeEventListener(ACCOUNT_PROGRESS_EVENT, onAccount);
      window.removeEventListener("storage", onLocal);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  useEffect(() => { void refresh(); }, [pathname, refresh]);

  const attempts = useMemo(() => {
    const byId = new Map(local.map((event) => [event.id, event]));
    for (const event of remote) {
      const device = byId.get(event.id);
      byId.set(event.id, device ? { ...device, ...event, practice: device.practice, response: device.response, contentVersion: device.contentVersion } : event);
    }
    return [...byId.values()].sort((a, b) => a.at - b.at);
  }, [local, remote]);
  const value = useMemo(() => ({ attempts, remoteIds, status, refresh }), [attempts, remoteIds, status, refresh]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressValue {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("useProgress must be used inside ProgressProvider");
  return value;
}
