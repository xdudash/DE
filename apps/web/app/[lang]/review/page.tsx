import { unitExercises } from "@deutschgo/content-kit";
import { graphFromBundle } from "@deutschgo/learning-engine";
import { ReviewBoard } from "../../../components/ReviewBoard";
import { bundle, dictionaryFor, t } from "../../../lib/content";
import { contentLanguageFor } from "../../../lib/i18n";

export default async function ReviewPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const contentLang = contentLanguageFor(lang);
  const content = bundle();
  const concepts = content.concepts.map((concept) => ({
    id: concept.id,
    title: t(dictionaryFor(concept.id, concept, contentLang), concept.title),
  }));
  const units = content.units.flatMap((unit) => {
    const exercises = unitExercises(unit);
    if (exercises.length === 0) return [];
    const dictionary = dictionaryFor(unit.id, unit, contentLang);
    return [{
      id: unit.id,
      version: unit.version,
      concepts: unit.concepts,
      exercises,
      text: Object.fromEntries(Object.entries(dictionary).map(([key, value]) => [key, value.text])),
    }];
  });

  return <ReviewBoard lang={lang} graph={graphFromBundle(content)} concepts={concepts} units={units} />;
}
