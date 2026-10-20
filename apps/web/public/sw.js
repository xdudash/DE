/**
 * DeutschGo service worker (ADR-0012).
 *
 * Scope of the promise this makes, deliberately narrow:
 *  - Pages and lessons you have already opened stay readable without a connection.
 *  - Nothing you answer offline is uploaded. Attempt sync is a separate task (P3),
 *    so the app must never suggest that offline progress reaches a server.
 *
 * Strategy:
 *  - Navigations: network first, fall back to the cached page, then to /offline.
 *    Network first keeps lesson content fresh; a cached shell is only a fallback.
 *  - Build assets and icons: cache first; their URLs change when the build changes.
 *  - Everything else (including /api): straight to the network, never cached.
 */
const VERSION = "v1";
const PAGES = `deutschgo-pages-${VERSION}`;
const ASSETS = `deutschgo-assets-${VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      // A failed precache must not leave a half-installed worker in control.
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== PAGES && k !== ASSETS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isAsset(url) {
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");
}

async function networkFirst(request) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    // Only successful, complete responses are worth keeping.
    if (response.ok && response.type === "basic") cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await cache.match(OFFLINE_URL);
    if (offline) return offline;
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Attempts and profile calls must always reach the server, or not happen at all.
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }
  if (isAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
});
