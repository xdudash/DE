import { DictionaryBoard, type DictionaryEntry } from "../../../components/DictionaryBoard";
import { readingStories } from "../../../lib/reading";

function sentence(tokens: { de: string }[]): string {
  return tokens.reduce((value, token, index) => {
    const closes = /^[.,?!:;»”’)]/.test(token.de);
    const followsOpen = index > 0 && /^[«„“(]$/.test(tokens[index - 1]!.de);
    return `${value}${index > 0 && !closes && !followsOpen ? " " : ""}${token.de}`;
  }, "");
}

export default async function DictionaryPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ q?: string }> }) {
  const [{ lang }, search] = await Promise.all([params, searchParams]);
  const stories = readingStories(lang);
  const entries: DictionaryEntry[] = stories.flatMap((story) => story.paragraphs.flatMap((paragraph, paragraphIndex) => {
    const context = sentence(paragraph);
    return paragraph.flatMap((token, tokenIndex) => token.lemma && token.gloss ? [{
      id: `${story.id}:${paragraphIndex}:${tokenIndex}`,
      storyId: story.id,
      storyTitle: story.title,
      level: story.level,
      word: token.de,
      lemma: token.lemma,
      meaning: token.gloss[lang] ?? token.gloss.en ?? "",
      context,
    }] : []);
  }));
  return <DictionaryBoard lang={lang} entries={entries} initialQuery={search.q ?? ""} />;
}
