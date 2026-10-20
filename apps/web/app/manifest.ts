import type { MetadataRoute } from "next";
import { appManifest } from "../lib/pwa/manifest";

/** Served at /manifest.webmanifest. The content lives in lib/pwa/manifest.ts. */
export default function manifest(): MetadataRoute.Manifest {
  return appManifest() as MetadataRoute.Manifest;
}
