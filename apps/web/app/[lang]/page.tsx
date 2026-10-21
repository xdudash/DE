import { DailyGoal } from "../../components/DailyGoal";
import { InstallPrompt } from "../../components/InstallPrompt";
import { LinePath, type Station } from "../../components/LinePath";
import { SlotLine } from "../../components/SlotLine";
import { bundle, dictionaryFor, t } from "../../lib/content";
import { pickLine } from "../../lib/path";
import { contentLanguageFor, localeInfo, ui } from "../../lib/i18n";

/** Content that has not passed human review is labelled wherever it is offered. */
const REVIEWED = new Set(["approved", "published"]);

/**
 * Home: the learner's line. The route that holds a written lesson is drawn as a transit
 * line with stations; the daily goal sits beside it. Everything else (all topics,
 * reviews, settings) is one tab away.
 */
export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const msg = ui(lang);
  const contentLang = contentLanguageFor(lang);
  const b = bundle();
  const units = new Map(b.units.map((u) => [u.id, u]));
  const concepts = new Map(b.concepts.map((c) => [c.id, c]));
  const title = (id: string, entity: unknown, key: string) => t(dictionaryFor(id, entity, contentLang), key);

  // A topic is taught by the first lesson that covers it.
  const unitForConcept = new Map<string, string>();
  for (const u of b.units) for (const c of u.concepts) if (!unitForConcept.has(c)) unitForConcept.set(c, u.id);

  // The line where a written lesson comes soonest (lib/path.ts).
  const route = pickLine(b.routes, (s) => !!((s.unit && units.has(s.unit)) || (s.concept && unitForConcept.has(s.concept))));

  const stations: Station[] = (route?.steps ?? []).flatMap((step, i): Station[] => {
    const unitId = step.unit ?? (step.concept ? unitForConcept.get(step.concept) : undefined);
    const unit = unitId ? units.get(unitId) : undefined;
    if (unit) {
      return [
        {
          id: `${i}-${unit.id}`,
          title: title(unit.id, unit, unit.title),
          kind: "lesson",
          unitId: unit.id,
          href: `/${lang}/learn/${unit.id}`,
          meta: msg("catalog.unitMeta", { level: unit.cefr, minutes: unit.estimated_minutes }),
          draft: !REVIEWED.has(unit.status),
          exerciseIds: unit.blocks.flatMap((block) => (block.type === "exercises" ? block.items.map((e) => e.id) : [])),
        },
      ];
    }
    const concept = step.concept ? concepts.get(step.concept) : undefined;
    if (!concept) return [];
    return [{ id: `${i}-${concept.id}`, title: title(concept.id, concept, concept.title), kind: "planned", exerciseIds: [] }];
  });

  // The illustration for the lesson that teaches it: its own sentence, verb in position 2.
  const firstLesson = stations.find((s) => s.kind === "lesson");
  const firstUnit = firstLesson?.unitId ? units.get(firstLesson.unitId) : undefined;
  const heroConcept = firstUnit ? concepts.get(firstUnit.concepts[0] ?? "") : undefined;
  const heroExample = heroConcept?.examples?.find((e) => e.highlight?.length === 1 && (e.highlight[0] ?? 0) >= 1);

  return (
    <main className="page home">
      <div className="home-grid">
        <div className="home-main">
          {localeInfo(lang).preview && <p className="banner">{msg("status.fallback", { language: "English" })}</p>}
          {route && (
            <LinePath
              lang={lang}
              line={{ title: title(route.id, route, route.title), badge: route.cefr.from }}
              stations={stations}
              preview={
                firstUnit && heroConcept && heroExample
                  ? {
                      unitId: firstUnit.id,
                      node: (
                        <SlotLine
                          example={heroExample}
                          caption={title(heroConcept.id, heroConcept, heroConcept.title)}
                          gloss={heroExample.gloss ? title(heroConcept.id, heroConcept, heroExample.gloss) : undefined}
                        />
                      ),
                    }
                  : undefined
              }
            />
          )}
        </div>
        <aside className="home-side">
          <DailyGoal lang={lang} />
          <InstallPrompt lang={lang} />
          <p className="small muted footnote">{msg("status.noPersistence")}</p>
        </aside>
      </div>
    </main>
  );
}
