import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "DeutschGo", template: "%s · DeutschGo" },
  description: "German for life, work and study in Germany, Austria and Switzerland.",
  applicationName: "DeutschGo",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1f3a5f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
