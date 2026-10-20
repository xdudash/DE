"use client";

/**
 * Phone navigation: the app's sections within thumb reach. CSS hides it from the
 * width where the header navigation appears, so the two never show at once.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { translator } from "@deutschgo/i18n";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Icons are decorative: every tab carries its name, so they are hidden from
// assistive technology rather than labelled twice.
const ICONS: Record<string, React.ReactNode> = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />
    </svg>
  ),
  practice: (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4h-4" />
    </svg>
  ),
  map: (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <circle cx="6" cy="7" r="2.5" /><circle cx="18" cy="12" r="2.5" /><circle cx="7" cy="18" r="2.5" />
      <path d="M8.2 8.3 15.6 11M16.4 14l-7 2.6" />
    </svg>
  ),
  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  ),
};

export function TabBar({ lang }: { lang: string }) {
  const msg = translator(lang);
  const pathname = usePathname() ?? `/${lang}`;
  const tabs = [
    { key: "home", href: `/${lang}`, label: msg("nav.home") },
    { key: "practice", href: `/${lang}/practice`, label: msg("nav.practice") },
    { key: "map", href: `/${lang}/map`, label: msg("nav.knowledgeMap") },
    { key: "profile", href: `/${lang}/me`, label: msg("nav.profile") },
  ];

  return (
    <nav className="tabbar" aria-label={msg("nav.tabs")}>
      <ul>
        {tabs.map((tab) => (
          <li key={tab.key}>
            <Link href={tab.href} aria-current={pathname === tab.href ? "page" : undefined}>
              {ICONS[tab.key]}
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
