import Link from "next/link";
import { bundle, dictionaryFor, explanationLanguages, t } from "../../lib/content";
import { ui } from "../../lib/ui-strings";

export default async function Catalog({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const b = bundle();
  const s = ui(lang);
  const units = new Map(b.units.map((u) => [u.id, u]));
  const concepts = new Map(b.concepts.map((c) => [c.id, c]));

  return (
    <main className="page">
      <header className="top">
        <h1>DeutschGo</h1>
        <p className="muted">{s.tagline}</p>
        <nav aria-label={s.chooseLanguage} className="langs inline">
          {explanationLanguages().map((l) => (
            <Link key={l.code} href={`/${l.code}`} aria-current={l.code === lang ? "page" : undefined}>{l.native_name}</Link>
          ))}
        </nav>
      </header>
      <p className="banner">{s.noPersistence}</p>

      {b.routes.map((r) => {
        const d = dictionaryFor(r.id, r, lang);
        return (
          <section key={r.id}>
            <h2>{s.route}: {t(d, r.title)}</h2>
            <p className="muted">{t(d, r.summary)} · {r.cefr.from}–{r.cefr.to}</p>
            <ol className="route">
              {r.steps.map((step, i) => {
                if (step.unit) {
                  const u = units.get(step.unit)!;
                  const ud = dictionaryFor(u.id, u, lang);
                  return (
                    <li key={i} className="step available">
                      <Link href={`/${lang}/learn/${u.id}`}>{t(ud, u.title)}</Link>
                      <span className="tag">{u.cefr}</span> <span className="tag">{u.estimated_minutes} {s.minutes}</span>
                      <span className="tag warn">{u.status}</span>
                    </li>
                  );
                }
                const c = concepts.get(step.concept!)!;
                const cd = dictionaryFor(c.id, c, lang);
                return (
                  <li key={i} className="step planned">
                    {t(cd, c.title)} <span className="tag">{c.cefr.introduced}</span> <span className="muted">— {s.planned}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      <section>
        <h2>{s.graph}</h2>
        <ul className="graph">
          {b.concepts.map((c) => {
            const cd = dictionaryFor(c.id, c, lang);
            const deps = (c.relations ?? []).filter((r) => r.type === "depends_on").map((r) => concepts.get(r.target)).filter((x) => !!x);
            return (
              <li key={c.id}>
                <strong>{t(cd, c.title)}</strong> <span className="tag">{c.cefr.introduced}</span>{" "}
                <span className={`tag ${c.status === "planned" ? "" : "warn"}`}>{c.status}</span>
                {deps.length > 0 && (
                  <span className="muted"> · {s.prerequisites}: {deps.map((dc) => t(dictionaryFor(dc.id, dc, lang), dc.title)).join(", ")}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
