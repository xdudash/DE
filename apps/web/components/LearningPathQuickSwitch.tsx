"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { translator } from "@deutschgo/i18n";
import { readSetup, writeSetup, type PathDifficulty, type Setup } from "../lib/device-state";
import { LearningPathPicker, type LearningPathCounts } from "./LearningPathPicker";

export function LearningPathQuickSwitch({ lang, paths }: { lang: string; paths: LearningPathCounts[] }) {
  const msg = translator(lang);
  const [difficulty, setDifficulty] = useState<PathDifficulty>("medium");
  const [notice, setNotice] = useState("");
  useEffect(() => setDifficulty(readSetup()?.difficulty ?? "medium"), []);

  function changeDifficulty(next: PathDifficulty) {
    const previous = readSetup() ?? { goal: "general", minutes: 10, difficulty: "medium" as const };
    const setup: Setup = { ...previous, difficulty: next };
    if (!writeSetup(setup)) {
      setNotice(msg("routeStudio.storageError"));
      return;
    }
    setDifficulty(next);
    setNotice(msg("learningPath.saved"));
  }

  return <section className="card learning-path-quick-switch" aria-label={msg("learningPath.title")}>
    <LearningPathPicker lang={lang} difficulty={difficulty} paths={paths} onChange={changeDifficulty} />
    <div className="learning-path-quick-footer">
      {notice && <span role="status">{notice}</span>}
      <Link href={`/${lang}/routes`}>{msg("learningPath.manage")} →</Link>
    </div>
  </section>;
}
