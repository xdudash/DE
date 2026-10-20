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
        <Link href={home} className="brand">{msg("app.name")}</Link>
        <nav aria-label={msg("nav.main")}>
          <ul className="mainnav">
            <li>
              <Link href={home} aria-current={pathname === home ? "page" : undefined}>{msg("nav.home")}</Link>
            </li>
            <li>
              <Link href={map} aria-current={pathname === map ? "page" : undefined}>{msg("nav.knowledgeMap")}</Link>
            </li>
          </ul>
        </nav>
        <nav aria-label={msg("app.chooseLanguage")}>
          <ul className="langs inline">
            {offeredLocales().map((l) => (
              <li key={l.code}>
                <Link href={switchTo(l.code)} lang={l.code} aria-current={l.code === lang ? "page" : undefined}>
                  {l.nativeName}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
