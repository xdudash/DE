/** Calls the server-side refresh endpoint; neither browser code nor callers receive tokens. */
let inFlight: Promise<boolean> | null = null;

export async function refreshBrowserSession(fetchImpl: typeof fetch = fetch): Promise<boolean> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const response = await fetchImpl("/auth/refresh", { method: "POST", cache: "no-store" });
      return response.status === 204;
    } catch {
      return false;
    }
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
