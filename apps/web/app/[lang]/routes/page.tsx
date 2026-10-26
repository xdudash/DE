import { RouteStudio } from "../../../components/RouteStudio";
import { bundle } from "../../../lib/content";
import { contentLanguageFor } from "../../../lib/i18n";
import { pickLine } from "../../../lib/path";
import { courseModulesByTopic, routeOptionsFromBundle } from "../../../lib/route-options";
import { coursePathCounts, courseRoadmap, courseSequence } from "../../../lib/course-paths";

export default async function RoutesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const content = bundle();
  const routes = routeOptionsFromBundle(content, lang, contentLanguageFor(lang));
  const modulesByTopic = courseModulesByTopic(content, lang, contentLanguageFor(lang));
  const units = new Set(content.units.map((unit) => unit.id));
  const unitForConcept = new Set(content.units.flatMap((unit) => unit.concepts));
  const defaultRoute = pickLine(content.routes, (step) => !!((step.unit && units.has(step.unit)) || (step.concept && unitForConcept.has(step.concept))))?.id ?? routes[0]?.id ?? "";
  return <RouteStudio lang={lang} routes={routes} defaultRouteId={defaultRoute} coursePaths={coursePathCounts(content.units.length)} courseRoadmaps={{ easy: courseRoadmap("easy", modulesByTopic), medium: courseRoadmap("medium", modulesByTopic), hard: courseRoadmap("hard", modulesByTopic) }} courseSequences={{ easy: courseSequence("easy", modulesByTopic), medium: courseSequence("medium", modulesByTopic), hard: courseSequence("hard", modulesByTopic) }} />;
}
