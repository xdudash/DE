import { LibraryBoard } from "../../../components/ReadingLibrary";
import { readingStories } from "../../../lib/reading";

export default async function LibraryPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return <LibraryBoard lang={lang} stories={readingStories(lang)} />;
}
