import { VocabularyBoard } from "../../../components/ReadingLibrary";
import { readingStories } from "../../../lib/reading";

export default async function VocabularyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const stories = readingStories(lang).map(({ id, title }) => ({ id, title }));
  return <VocabularyBoard lang={lang} stories={stories} />;
}
