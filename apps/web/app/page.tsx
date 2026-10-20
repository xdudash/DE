import { InstallPrompt } from "../components/InstallPrompt";
import { LanguageGate } from "../components/LanguageGate";
import { ui } from "../lib/i18n";

/**
 * The language gate: the only page without a locale in the URL, and the start URL
 * of the installed app. It states what DeutschGo is before asking anything, so an
 * installed app does not open on a bare list of languages.
 */
export default function Home() {
  const msg = ui("en");
  return (
    <main className="page gate-page">
      <h1>{msg("app.name")}</h1>
      <p className="lead">{msg("app.tagline")}</p>
      <ul className="points">
        <li>{msg("gate.point.explanations")}</li>
        <li>{msg("gate.point.route")}</li>
        <li>{msg("gate.point.free")}</li>
      </ul>
      <LanguageGate />
      <InstallPrompt lang="en" />
    </main>
  );
}
