/**
 * The installable app manifest (ADR-0001: PWA first, Capacitor later; ADR-0012:
 * installability and the app shell). Kept out of app/manifest.ts so it can be
 * unit-tested without the Next.js runtime.
 *
 * Install criteria this has to satisfy: a name, a start URL inside the scope, a
 * standalone display mode, and 192px and 512px icons with a maskable variant.
 */

export interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose: "any" | "maskable";
}

export interface AppManifest {
  id: string;
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  scope: string;
  display: "standalone";
  display_override: string[];
  orientation: "any";
  lang: string;
  dir: "ltr";
  categories: string[];
  background_color: string;
  theme_color: string;
  icons: ManifestIcon[];
}

/** Kept in step with --accent and --bg in app/globals.css. */
export const THEME_COLOR = "#1f3a5f";
export const BACKGROUND_COLOR = "#ffffff";

export function appManifest(): AppManifest {
  return {
    id: "/",
    name: "DeutschGo",
    short_name: "DeutschGo",
    description: "German for life, work and study in Germany, Austria and Switzerland.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // minimal-ui keeps a reload control on browsers that do not do standalone well.
    display_override: ["standalone", "minimal-ui"],
    // Lessons are read on phones and tablets in both orientations; nothing is locked.
    orientation: "any",
    // The install surface is the language gate, which is the pivot language.
    lang: "en",
    dir: "ltr",
    categories: ["education"],
    background_color: BACKGROUND_COLOR,
    theme_color: THEME_COLOR,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
