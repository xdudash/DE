import Link from "next/link";
import { graphFromBundle, routeFromBundle } from "@deutschgo/learning-engine";
import { InstallPrompt } from "../../components/InstallPrompt";
import { MotivationStrip } from "../../components/Motivation";
import type { TargetLink } from "../../components/NextStep";
import { NextStep } from "../../components/NextStep";
import { SetupForm } from "../../components/SetupForm";
import { SlotLine } from "../../components/SlotLine";
import { bundle, dictionaryFor, t } from "../../lib/content";
import { contentLanguageFor, localeInfo, ui } from "../../lib/i18n";

/** Content that has not passed human review is labelled wherever it is offered. */
const REVIEWED = new Set(["approved", "published"]);

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
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

  // The hero is that lesson's own concept, shown as the sentence it teaches.
  const heroConcept = firstUnit ? concepts.get(firstUnit.concepts[0] ?? "") : undefined;
  const heroExample = heroConcept?.examples?.find((e) => e.highlight?.length === 1 && (e.highlight[0] ?? 0) >= 1);

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
        <h1>{msg("app.tagline")}</h1>
      </header>

      {heroConcept && heroExample && (
        <SlotLine
          example={heroExample}
          caption={title(heroConcept.id, heroConcept, heroConcept.title)}
          gloss={heroExample.gloss ? title(heroConcept.id, heroConcept, heroExample.gloss) : undefined}
        />
      )}

      <MotivationStrip lang={lang} />

      {localeInfo(lang).preview && <p className="banner">{msg("status.fallback", { language: "English" })}</p>}
      <p className="banner">{msg("status.noPersistence")}</p>

      <section className="start" aria-labelledby="start-heading">
        <h2 id="start-heading">{msg("home.start")}</h2>
        <p className="lead">{msg("home.intro")}</p>
        <SetupForm
          lang={lang}
          startHref={firstUnit ? `/${lang}/learn/${firstUnit.id}` : undefined}
          startTitle={firstUnit ? msg("home.startCta") : undefined}
          startSub={firstUnit ? title(firstUnit.id, firstUnit, firstUnit.title) : undefined}
        />
        <p className="muted small">{msg("home.startNote")}</p>
        <InstallPrompt lang={lang} />
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
                    <Link href={`/${lang}/learn/${u.id}`}>{title(u.id, u, u.title)}</Link>
                    <div className="step-meta">
                      <span className="tag">{msg("catalog.unitMeta", { level: u.cefr, minutes: u.estimated_minutes })}</span>
                      {!REVIEWED.has(u.status) && <span className="tag warn">{msg("status.draftTag")}</span>}
                    </div>
                  </li>
                );
              }
              const c = concepts.get(step.concept ?? "");
              if (!c) return null;
              return (
                <li key={i} className="step planned">
                  {title(c.id, c, c.title)}
                  <div className="step-meta">
                    <span className="tag">{c.cefr.introduced}</span>
                    <span>{msg("catalog.plannedConcept")}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </main>
  );
}
