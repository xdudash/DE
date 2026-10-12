import { notFound } from "next/navigation";
import { explanationLanguages } from "../../lib/content";

export function generateStaticParams() {
  return explanationLanguages().map((l) => ({ lang: l.code }));
}

export const dynamicParams = false;

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const info = explanationLanguages().find((l) => l.code === lang);
  if (!info) notFound();
  return (
    <div lang={lang} dir={info.dir}>
      {children}
    </div>
  );
}
