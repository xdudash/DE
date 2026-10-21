"use client";

/**
 * The app frame. On a phone it is a slim top bar: the brand and the learner's streak,
 * XP and hearts; sections live in the bottom tab bar. On a wide screen the same
 * element becomes the left navigation column, with the language switch at its foot.
 * The current page is marked with aria-current; switching language keeps the page.
 */
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { offeredLocales, translator } from "@deutschgo/i18n";
import { writeLanguage } from "../lib/device-state";
import { Icon, type IconName } from "./Icon";
import { StatusPills } from "./StatusPills";

export function sectionsFor(lang: string) {
  const msg = translator(lang);
  const items: { key: IconName; href: string; label: string }[] = [
    { key: "home", href: `/${lang}`, label: msg("nav.home") },
    { key: "practice", href: `/${lang}/practice`, label: msg("nav.practice") },
    { key: "map", href: `/${lang}/map`, label: msg("nav.knowledgeMap") },
    { key: "profile", href: `/${lang}/me`, label: msg("nav.profile") },
  ];
  return items;
}

export function AppHeader({ lang }: { lang: string }) {
  const msg = translator(lang);
  const pathname = usePathname() ?? `/${lang}`;

  // Remember the language so the gate can offer to continue here next time.
  useEffect(() => {
    writeLanguage(lang);
  }, [lang]);

  // Same page in another language: replace the locale segment of the current path.
  const switchTo = (code: string) => pathname.replace(new RegExp(`^/${lang}(?=/|$)`), `/${code}`);

  return (
    <header className="appbar">
      <div className="appbar-inner">
        <Link href={`/${lang}`} className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 4l8 8-8 8" />
            </svg>
          </span>
          <span className="brand-name">{msg("app.name")}</span>
        </Link>
        <StatusPills lang={lang} />
        <nav aria-label={msg("nav.main")} className="mainnav-wrap">
          <ul className="mainnav">
            {sectionsFor(lang).map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
                  <Icon name={item.key} size={22} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={msg("app.chooseLanguage")} className="langs-wrap">
          <ul className="langs">
            {offeredLocales().map((l) => (
              <li key={l.code}>
                {/* The code keeps the control compact; the accessible name is the language's own name. */}
                <Link
                  href={switchTo(l.code)}
                  lang={l.code}
                  aria-label={l.nativeName}
                  aria-current={l.code === lang ? "page" : undefined}
                >
                  <span aria-hidden="true">{l.code.toUpperCase()}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
