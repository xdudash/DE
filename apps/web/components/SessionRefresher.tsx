"use client";

/** Refreshes a signed-in browser session once whenever the app shell starts. */
import { useEffect } from "react";
import { refreshBrowserSession } from "../lib/auth/browser-refresh.ts";

export function SessionRefresher() {
  useEffect(() => {
    void refreshBrowserSession();
  }, []);
  return null;
}
