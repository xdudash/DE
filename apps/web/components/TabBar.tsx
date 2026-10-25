"use client";

/**
 * Phone navigation: the app's sections within thumb reach. CSS hides it from the
 * width where the navigation column appears, so the two never show at once.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { translator } from "@deutschgo/i18n";
import { sectionsFor } from "./AppHeader";
import { Icon } from "./Icon";

export function TabBar({ lang }: { lang: string }) {
  const msg = translator(lang);
  const pathname = usePathname() ?? `/${lang}`;

  return (
    <nav className="tabbar" aria-label={msg("nav.tabs")}>
      <ul>
        {sectionsFor(lang).map((tab) => (
          <li key={tab.key}>
            <Link href={tab.href} aria-current={(tab.key === "home" ? pathname === tab.href : pathname.startsWith(tab.href)) ? "page" : undefined}>
              <span className="tab-icon">
                <Icon name={tab.key} size={24} />
              </span>
              <span className="tab-label">{tab.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
