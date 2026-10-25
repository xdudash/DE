import { notFound } from "next/navigation";
import { AppHeader } from "../../components/AppHeader";
import { OfflineNotice } from "../../components/OfflineNotice";
import { OutboxSync } from "../../components/OutboxSync";
import { SessionRefresher } from "../../components/SessionRefresher";
import { ProgressProvider } from "../../lib/progress/client";
import { TabBar } from "../../components/TabBar";
import { isRoutableLocale, localeInfo, routableLocales } from "../../lib/i18n";

export function generateStaticParams() {
  return routableLocales().map((l) => ({ lang: l.code }));
}

export const dynamicParams = false;

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isRoutableLocale(lang)) notFound();
  const info = localeInfo(lang);
  return (
    <div lang={lang} dir={info.dir} data-locale={lang} data-preview={info.preview ? "true" : undefined} className="shell">
      <OfflineNotice lang={lang} />
      {/* Refresh first: an outbox send that meets an expired session then joins this
          refresh instead of starting a second one (lib/auth/browser-refresh.ts). */}
      <SessionRefresher />
      <OutboxSync />
      <ProgressProvider>
        <AppHeader lang={lang} />
        {children}
        <TabBar lang={lang} />
      </ProgressProvider>
    </div>
  );
}
