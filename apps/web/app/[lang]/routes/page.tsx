import { RouteStudio } from "../../../components/RouteStudio";
import { bundle } from "../../../lib/content";
import { contentLanguageFor } from "../../../lib/i18n";
import { pickLine } from "../../../lib/path";
import { routeOptionsFromBundle } from "../../../lib/route-options";
import { coursePathCounts, courseRoadmap } from "../../../lib/course-paths";
import { dictionaryFor, t } from "../../../lib/content";

const CURRICULUM_TOPIC_BY_CONCEPT: Record<string, string[]> = {
  alphabet: ["alphabet"], umlauts: ["umlaute"], eszett_and_ss: ["eszett"],
  long_short_vowels: ["vowels_length"], greetings_dach: ["greetings"], goodbyes: ["goodbyes"],
  numbers_cardinal: ["numbers_0_20", "numbers_20_100"], verb_present_conjugation: ["present_regular", "present_irregular"],
  verb_modals: ["modal_koennen_muessen", "modal_wollen_moechten", "modal_duerfen_sollen"],
  verb_separable_prefix: ["separable_verbs"], imperative: ["imperative_sie"],
  v1_yes_no_questions: ["yes_no_questions"], w_questions: ["w_questions"], v2_declarative: ["present_regular"],
  case_accusative: ["nominativ_akkusativ"],
  pronoun_accusative: ["accusative_pronouns"],
};

export default async function RoutesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const content = bundle();
  const routes = routeOptionsFromBundle(content, lang, contentLanguageFor(lang));
  const modulesByTopic: Record<string, Array<{ id: string; title: string; href: string }>> = {};
  for (const unit of content.units) {
    const topics = new Set(unit.concepts.flatMap((conceptId) => CURRICULUM_TOPIC_BY_CONCEPT[conceptId.split(".").at(-1) ?? ""] ?? []));
    const dictionary = dictionaryFor(unit.id, unit, contentLanguageFor(lang));
    const module = { id: unit.id, title: t(dictionary, unit.title), href: `/${lang}/learn/${unit.id}` };
    for (const topic of topics) (modulesByTopic[topic] ??= []).push(module);
  }
  const units = new Set(content.units.map((unit) => unit.id));
  const unitForConcept = new Set(content.units.flatMap((unit) => unit.concepts));
  const defaultRoute = pickLine(content.routes, (step) => !!((step.unit && units.has(step.unit)) || (step.concept && unitForConcept.has(step.concept))))?.id ?? routes[0]?.id ?? "";
  return <RouteStudio lang={lang} routes={routes} defaultRouteId={defaultRoute} coursePaths={coursePathCounts(content.units.length)} courseRoadmaps={{ easy: courseRoadmap("easy", modulesByTopic), medium: courseRoadmap("medium", modulesByTopic), hard: courseRoadmap("hard", modulesByTopic) }} />;
}
