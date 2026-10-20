import Link from "next/link";
import { offeredLocales, ui } from "../lib/i18n";

/** Language gate: the only page without a locale in the URL. */
export default function Home() {
  const locales = offeredLocales();
  return (
    <main className="page">
      <h1>{ui("en")("app.name")}</h1>
      <p className="lead">{ui("en")("app.tagline")}</p>
      <p className="muted">{locales.map((l) => ui(l.code)("app.chooseLanguage")).join(" · ")}</p>
      <ul className="langs">
        {locales.map((l) => (
          <li key={l.code}>
            <Link href={`/${l.code}`} lang={l.code} dir={l.dir}>{l.nativeName}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
