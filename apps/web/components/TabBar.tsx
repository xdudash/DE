"use client";

/**
 * Phone navigation: a bottom bar with the app's sections, within thumb reach.
 * CSS hides it from the width where the header navigation is visible, so the two
 * never appear at once.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { translator } from "@deutschgo/i18n";

export function TabBar({ lang }: { lang: string }) {
  const msg = translator(lang);
  const pathname = usePathname() ?? `/${lang}`;
  // Icons are decorative: each tab also carries its name, so they are hidden from
  // assistive technology rather than labelled twice.
  const home = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />
    </svg>
  );
  const map = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="7" r="2.5" /><circle cx="18" cy="12" r="2.5" /><circle cx="7" cy="18" r="2.5" />
      <path d="M8.2 8.3 15.6 11M16.4 14l-7 2.6" />
    </svg>
  );
  const tabs = [
    { href: `/${lang}`, label: msg("nav.home"), icon: home },
    { href: `/${lang}/map`, label: msg("nav.knowledgeMap"), icon: map },
  ];

  return (
    <nav className="tabbar" aria-label={msg("nav.tabs")}>
      <ul>
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link href={tab.href} aria-current={pathname === tab.href ? "page" : undefined}>
              {tab.icon}
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
