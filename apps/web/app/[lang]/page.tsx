import Link from "next/link";
import type { TargetLink } from "../../components/NextStep";
import { NextStep } from "../../components/NextStep";
import { SetupForm } from "../../components/SetupForm";
import { bundle, dictionaryFor, t } from "../../lib/content";
import { contentLanguageFor, localeInfo, ui } from "../../lib/i18n";
import { graphFromBundle, routeFromBundle } from "@deutschgo/learning-engine";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const msg = ui(lang);
  const contentLang = contentLanguageFor(lang);
  const b = bundle();
  const units = new Map(b.units.map((u) => [u.id, u]));
  const title = (id: string, entity: unknown, key: string) => t(dictionaryFor(id, entity, contentLang), key);

  // The first step of the first route that points at an authored unit: the natural starting point.
  const firstStep = b.routes.flatMap((r) => r.steps).find((s) => s.unit && units.has(s.unit));
  const firstUnit = firstStep?.unit ? units.get(firstStep.unit) : undefined;

  // Engine inputs and link targets, built once on the server.
  const graph = graphFromBundle(b);
  const mainRoute = b.routes[0];
  // Only steps with an authored lesson can be recommended: a planned topic cannot be studied yet.
  const route = (mainRoute ? routeFromBundle(b, mainRoute.id) : []).filter((step) => step.kind === "unit");
  const targets: Record<string, TargetLink> = {};
  for (const u of b.units) targets[u.id] = { title: title(u.id, u, u.title), href: `/${lang}/learn/${u.id}` };
  for (const c of b.concepts) targets[c.id] = { title: title(c.id, c, c.title), href: `/${lang}/map#${c.id}` };

  return (
    <main className="page">
      <header className="top">
        <h1>{msg("app.name")}</h1>
        <p className="muted">{msg("app.tagline")}</p>
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

      {route.length > 0 && <NextStep lang={lang} graph={graph} route={route} targets={targets} />}

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
              const c = b.concepts.find((x) => x.id === step.concept);
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
    </main>
  );
}
