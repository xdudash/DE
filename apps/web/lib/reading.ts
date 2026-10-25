import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReadingStory } from "../components/ReadingLibrary";

interface SourceStory extends Omit<ReadingStory, "title" | "summary"> {
  title: Record<string, string>;
  summary: Record<string, string>;
}

let cache: SourceStory[] | undefined;

export function readingStories(lang: string): ReadingStory[] {
  if (!cache) {
    const file = join(process.cwd(), "..", "..", "content", "reading", "stories.json");
    const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
    if (!Array.isArray(parsed)) throw new Error("Reading content must be a list");
    cache = parsed as SourceStory[];
    for (const story of cache) {
      if (!story.id || !story.title?.en || !Array.isArray(story.paragraphs) || story.paragraphs.some((p) => !Array.isArray(p))) {
        throw new Error(`Invalid reading story: ${story.id ?? "unknown"}`);
      }
    }
  }
  return cache.map((story) => ({
    ...story,
    title: story.title[lang] ?? story.title.en!,
    summary: story.summary[lang] ?? story.summary.en!,
  }));
}
