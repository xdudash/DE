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
  const tabs = [
    { href: `/${lang}`, label: msg("nav.home") },
    { href: `/${lang}/map`, label: msg("nav.knowledgeMap") },
  ];

  return (
    <nav className="tabbar" aria-label={msg("nav.tabs")}>
      <ul>
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link href={tab.href} aria-current={pathname === tab.href ? "page" : undefined}>
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
