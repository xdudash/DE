import { InstallPrompt } from "../../components/InstallPrompt";
import { Dashboard } from "../../components/Dashboard";
import { SlotLine } from "../../components/SlotLine";
import { bundle, dictionaryFor, t } from "../../lib/content";
import { contentLanguageFor, ui } from "../../lib/i18n";

/** Content that has not passed human review is labelled wherever it is offered. */
const REVIEWED = new Set(["approved", "published"]);

/**
 * Home is the learner's panel: one card to continue, today's goal and the three figures.
 * The route and the full list of topics live on the map, not here.
 */
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

  // The hero illustrates the lesson's own sentence, with its finite verb in the accent colour.
  const heroConcept = firstUnit ? concepts.get(firstUnit.concepts[0] ?? "") : undefined;
  const heroExample = heroConcept?.examples?.find((e) => e.highlight?.length === 1 && (e.highlight[0] ?? 0) >= 1);

  const start = firstUnit
    ? {
        href: `/${lang}/learn/${firstUnit.id}`,
        title: title(firstUnit.id, firstUnit, firstUnit.title),
        summary: title(firstUnit.id, firstUnit, firstUnit.summary),
        draft: !REVIEWED.has(firstUnit.status),
      }
    : undefined;

  return (
    <main className="page">
      <Dashboard
        lang={lang}
        start={start}
        hero={
          heroConcept && heroExample ? (
            <SlotLine
              example={heroExample}
              caption={title(heroConcept.id, heroConcept, heroConcept.title)}
              gloss={heroExample.gloss ? title(heroConcept.id, heroConcept, heroExample.gloss) : undefined}
            />
          ) : undefined
        }
        notice={msg("status.noPersistence")}
      />
      <InstallPrompt lang={lang} />
    </main>
  );
}
