import Link from "next/link";
import { SetupForm } from "../../components/SetupForm";
import { bundle, dictionaryFor, t } from "../../lib/content";
import { contentLanguageFor, localeInfo, offeredLocales, ui } from "../../lib/i18n";

export default async function Catalog({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const msg = ui(lang);
  const contentLang = contentLanguageFor(lang);
  const b = bundle();
  const units = new Map(b.units.map((u) => [u.id, u]));
  const concepts = new Map(b.concepts.map((c) => [c.id, c]));
  const title = (id: string, entity: unknown, key: string) => t(dictionaryFor(id, entity, contentLang), key);

  // The first step of the first route that points at an authored unit: the natural starting point.
  const firstStep = b.routes.flatMap((r) => r.steps).find((s) => s.unit && units.has(s.unit));
  const firstUnit = firstStep?.unit ? units.get(firstStep.unit) : undefined;

  return (
    <main className="page">
      <header className="top">
        <h1>{msg("app.name")}</h1>
        <p className="muted">{msg("app.tagline")}</p>
        <nav aria-label={msg("app.chooseLanguage")} className="langs inline">
          {offeredLocales().map((l) => (
            <Link key={l.code} href={`/${l.code}`} lang={l.code} aria-current={l.code === lang ? "page" : undefined}>
              {l.nativeName}
            </Link>
          ))}
        </nav>
      </header>
      {localeInfo(lang).preview && (
        <p className="banner">{msg("status.fallback", { language: "English" })}</p>
      )}
      <p className="banner">{msg("status.noPersistence")}</p>

      <section className="start" aria-labelledby="start-heading">
        <h2 id="start-heading">{msg("home.start")}</h2>
        <p className="lead">{msg("home.intro")}</p>
        <SetupForm
          lang={lang}
          startHref={firstUnit ? `/${lang}/learn/${firstUnit.id}` : undefined}
          startTitle={firstUnit ? `${msg("home.startCta")}: ${title(firstUnit.id, firstUnit, firstUnit.title)}` : undefined}
        />
        <p className="muted small">{msg("home.startNote")}</p>
      </section>

      {b.routes.map((r) => (
        <section key={r.id}>
          <h2>{msg("nav.route")}: {title(r.id, r, r.title)}</h2>
          <p className="muted">
            {title(r.id, r, r.summary)}
            {" · "}
            {msg("catalog.routeSummary", { from: r.cefr.from, to: r.cefr.to, steps: r.steps.length })}
          </p>
          <ol className="route">
            {r.steps.map((step, i) => {
              if (step.unit) {
                const u = units.get(step.unit);
                if (!u) return null;
                return (
                  <li key={i} className="step available">
                    <Link href={`/${lang}/learn/${u.id}`}>{title(u.id, u, u.title)}</Link>{" "}
                    <span className="tag">{msg("catalog.unitMeta", { level: u.cefr, minutes: u.estimated_minutes })}</span>{" "}
                    <span className="tag warn">{u.status}</span>
                  </li>
                );
              }
              const c = concepts.get(step.concept!);
              if (!c) return null;
              return (
                <li key={i} className="step planned">
                  {title(c.id, c, c.title)} <span className="tag">{c.cefr.introduced}</span>{" "}
                  <span className="muted">— {msg("catalog.plannedConcept")}</span>
                  {step.optional && <span className="tag">optional</span>}
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <section>
        <h2>{msg("nav.knowledgeMap")}</h2>
        <p className="muted">{msg("catalog.conceptCount", { count: b.concepts.length })}</p>
        <ul className="graph">
          {b.concepts.map((c) => {
            const deps = (c.relations ?? [])
              .filter((r) => r.type === "depends_on")
              .map((r) => concepts.get(r.target))
              .filter((x) => !!x);
            return (
              <li key={c.id}>
                <strong>{title(c.id, c, c.title)}</strong> <span className="tag">{c.cefr.introduced}</span>{" "}
                <span className={`tag ${c.status === "planned" ? "" : "warn"}`}>{c.status}</span>
                {deps.length > 0 && (
                  <span className="muted">
                    {" · "}{msg("catalog.prerequisites")}: {deps.map((d) => title(d.id, d, d.title)).join(", ")}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
