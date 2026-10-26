import { ExerciseCatalog } from "../../../components/ExerciseCatalog";
import { bundle } from "../../../lib/content";

export default async function ExercisesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const counts: Record<string, number> = {};
  for (const unit of bundle().units) for (const block of unit.blocks) if (block.type === "exercises") for (const exercise of block.items) counts[exercise.type] = (counts[exercise.type] ?? 0) + 1;
  return <ExerciseCatalog lang={lang} counts={counts} />;
}
