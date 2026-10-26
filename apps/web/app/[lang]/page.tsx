import { DailyGoal } from "../../components/DailyGoal";
import { InstallPrompt } from "../../components/InstallPrompt";
import { LinePath } from "../../components/LinePath";
import { SlotLine } from "../../components/SlotLine";
import { NextStepCard } from "../../components/NextStepCard";
import { bundle, dictionaryFor, t } from "../../lib/content";
import { pickLine } from "../../lib/path";
import { graphFromBundle } from "@deutschgo/learning-engine";
import Link from "next/link";
import { scenarioMissions } from "../../lib/missions";
import { contentLanguageFor, localeInfo, ui } from "../../lib/i18n";
import { courseModulesByTopic, routeOptionsFromBundle } from "../../lib/route-options";
import { coursePathCounts, courseSequence } from "../../lib/course-paths";
import { LearningPathQuickSwitch } from "../../components/LearningPathQuickSwitch";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const msg = ui(lang);
  const contentLang = contentLanguageFor(lang);
  const b = bundle();
  const units = new Map(b.units.map((unit) => [unit.id, unit]));
  const concepts = new Map(b.concepts.map((concept) => [concept.id, concept]));
  const title = (id: string, entity: unknown, key: string) => t(dictionaryFor(id, entity, contentLang), key);
  const unitForConcept = new Map<string, string>();
  for (const unit of b.units) for (const concept of unit.concepts) if (!unitForConcept.has(concept)) unitForConcept.set(concept, unit.id);

  const baseRoutes = routeOptionsFromBundle(b, lang, contentLang);
  const modulesByTopic = courseModulesByTopic(b, lang, contentLang);
  const courseSequences = {
    easy: courseSequence("easy", modulesByTopic),
    medium: courseSequence("medium", modulesByTopic),
    hard: courseSequence("hard", modulesByTopic),
  };
  const routes = baseRoutes.map((route) => {
    const firstLesson = route.steps.find((step) => step.kind === "lesson");
    const unit = firstLesson?.unitId ? units.get(firstLesson.unitId) : undefined;
    const concept = unit ? concepts.get(unit.concepts[0] ?? "") : undefined;
    const example = concept?.examples?.find((item) => item.highlight?.length === 1 && (item.highlight[0] ?? 0) >= 1);
    return {
      ...route,
      ...(unit && concept && example ? { preview: {
        unitId: unit.id,
        node: <SlotLine
          example={example}
          caption={title(concept.id, concept, concept.title)}
          gloss={example.gloss ? title(concept.id, concept, example.gloss) : undefined}
        />,
      } } : {}),
    };
  });
  const preferredDefault = pickLine(b.routes, (step) => !!((step.unit && units.has(step.unit)) || (step.concept && unitForConcept.has(step.concept))));
  const defaultRouteId = preferredDefault?.id ?? routes[0]?.id ?? "";

  const targets: Record<string, { title: string; href: string }> = {};
  for (const unit of b.units) targets[unit.id] = { title: title(unit.id, unit, unit.title), href: `/${lang}/learn/${unit.id}` };
  for (const concept of b.concepts) {
    const unitId = unitForConcept.get(concept.id);
    targets[concept.id] = unitId
      ? { title: title(unitId, units.get(unitId), units.get(unitId)!.title), href: `/${lang}/learn/${unitId}` }
      : { title: title(concept.id, concept, concept.title), href: `/${lang}/map#${concept.id}` };
  }
  const featuredMission = scenarioMissions(b, (id, ref) => title(id, units.get(id), ref))[0];

  return (
    <main className="page home">
      <div className="home-grid">
        <div className="home-main">
          {localeInfo(lang).preview && <p className="banner">{msg("status.fallback", { language: "English" })}</p>}
          {routes.length > 0 && <LinePath lang={lang} routes={routes} defaultRouteId={defaultRouteId} />}
        </div>
        <aside className="home-side">
          <LearningPathQuickSwitch lang={lang} paths={coursePathCounts(b.units.length)} />
          <NextStepCard lang={lang} graph={graphFromBundle(b)} routes={routes} defaultRouteId={defaultRouteId} targets={targets} courseSequences={courseSequences} />
          {featuredMission && <section className="card next-step">
            <h2 className="card-title">{msg("mission.title")}</h2>
            <p className="lead">{featuredMission.title}</p>
            <p className="muted small">{featuredMission.summary}</p>
            <Link className="btn btn-primary" href={`/${lang}/mission/${featuredMission.unitId}`}>{msg("mission.homeCta")}</Link>
          </section>}
          <DailyGoal lang={lang} />
          <InstallPrompt lang={lang} />
        </aside>
      </div>
    </main>
  );
}
