import type { MetadataRoute } from "next";

// Installable PWA metadata (ADR-0001). Offline caching is a separate, later task.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DeutschGo",
    short_name: "DeutschGo",
    description: "German for life, work and study in Germany, Austria and Switzerland.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1f3a5f",
  };
}
