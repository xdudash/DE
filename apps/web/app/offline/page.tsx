import { offeredLocales, ui } from "../../lib/i18n";

export const metadata = { title: "Offline" };

/**
 * Shown by the service worker when a page was never opened online and there is no
 * connection. It has no locale in its URL — the worker cannot know which language
 * the learner wanted — so it says the same thing in every offered language.
 */
export default function Offline() {
  return (
    <main className="page">
      <h1>{ui("en")("offline.title")}</h1>
      {offeredLocales().map((l) => (
        <p key={l.code} lang={l.code} dir={l.dir} className={l.code === "en" ? "lead" : "muted"}>
          {ui(l.code)("offline.body")}
        </p>
      ))}
    </main>
  );
}
