"use client";

export interface SavedWord {
  id: string;
  storyId: string;
  word: string;
  lemma: string;
  meaning: string;
  context: string;
  savedAt: number;
  dueAt: number;
  step: number;
  reviews: number;
}

const KEY = "deutschgo.vocabulary.v1";
const INTERVALS = [1, 3, 7, 16, 35];

function readAll(): SavedWord[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is SavedWord => item && typeof item.id === "string" && typeof item.word === "string" && typeof item.dueAt === "number");
  } catch {
    return [];
  }
}

function writeAll(words: SavedWord[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(words));
    return true;
  } catch {
    return false;
  }
}

export function listSavedWords(): SavedWord[] {
  return readAll().sort((a, b) => a.dueAt - b.dueAt || b.savedAt - a.savedAt);
}

export function saveWord(input: Omit<SavedWord, "savedAt" | "dueAt" | "step" | "reviews">): boolean {
  const all = readAll();
  if (all.some((item) => item.id === input.id)) return true;
  const now = Date.now();
  return writeAll([...all, { ...input, savedAt: now, dueAt: now + 60_000, step: 0, reviews: 0 }]);
}

export function gradeWord(id: string, remembered: boolean): boolean {
  const now = Date.now();
  return writeAll(readAll().map((word) => {
    if (word.id !== id) return word;
    const step = remembered ? Math.min(word.step + 1, INTERVALS.length - 1) : 0;
    const delay = remembered ? INTERVALS[step]! * 86_400_000 : 10 * 60_000;
    return { ...word, step, dueAt: now + delay, reviews: word.reviews + 1 };
  }));
}

export function removeWord(id: string): boolean {
  return writeAll(readAll().filter((word) => word.id !== id));
}
