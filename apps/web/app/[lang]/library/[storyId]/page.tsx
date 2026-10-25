import { notFound } from "next/navigation";
import { ReadingArticle } from "../../../../components/ReadingLibrary";
import { readingStories } from "../../../../lib/reading";

export function generateStaticParams() {
  return ["en", "uk", "ru", "ar"].flatMap((lang) => [{ lang, storyId: "morgens-am-bahnhof" }]);
}

export default async function ReadingPage({ params }: { params: Promise<{ lang: string; storyId: string }> }) {
  const { lang, storyId } = await params;
  const story = readingStories(lang).find((item) => item.id === storyId);
  if (!story) notFound();
  return <ReadingArticle lang={lang} story={story} />;
}
