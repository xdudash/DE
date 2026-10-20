"use client";

/**
 * App-wide header: brand, main navigation and the explanation-language picker. The
 * current page is marked with aria-current; switching language keeps the same page.
 */
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { offeredLocales, translator } from "@deutschgo/i18n";
import { writeLanguage } from "../lib/device-state";

export function AppHeader({ lang }: { lang: string }) {
  const msg = translator(lang);
  const pathname = usePathname() ?? `/${lang}`;
  const home = `/${lang}`;

  // Remember the language so the gate can offer to continue here next time.
  useEffect(() => {
    writeLanguage(lang);
  }, [lang]);

  const map = `/${lang}/map`;

  // Same page in another language: replace the locale segment of the current path.
  const switchTo = (code: string) => pathname.replace(new RegExp(`^/${lang}(?=/|$)`), `/${code}`);

  return (
    <header className="appbar">
      <div className="appbar-inner">
        <Link href={home} className="brand">
          {/* The mark is the app icon's chevron: one shape across icon and header. */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 4l8 8-8 8" />
          </svg>
          {msg("app.name")}
        </Link>
        <nav aria-label={msg("nav.main")}>
          <ul className="mainnav">
            {[
              { href: home, label: msg("nav.home") },
              { href: `/${lang}/practice`, label: msg("nav.practice") },
              { href: map, label: msg("nav.knowledgeMap") },
              { href: `/${lang}/me`, label: msg("nav.profile") },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={msg("app.chooseLanguage")}>
          <ul className="langs inline">
            {offeredLocales().map((l) => (
              <li key={l.code}>
                {/* The code keeps the control compact on a phone; the accessible
                    name stays the language's own name. */}
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
