import type { NextConfig } from "next";

const config: NextConfig = {
  // The content kit is shipped as TypeScript source inside the monorepo.
  transpilePackages: ["@deutschgo/content-kit", "@deutschgo/i18n"],
  reactStrictMode: true,
  poweredByHeader: false,
};

export default config;
