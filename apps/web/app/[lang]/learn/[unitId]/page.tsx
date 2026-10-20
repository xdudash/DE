import Link from "next/link";
import { notFound } from "next/navigation";
import type { Block } from "@deutschgo/content-kit";
import { ExercisePlayer } from "../../../../components/ExercisePlayer";
import { GermanSentence } from "../../../../components/GermanSentence";
import { LessonSummary } from "../../../../components/LessonSummary";
import { bundle, dictionaryFor, t, type Dictionary } from "../../../../lib/content";
import { Markdown, inline } from "../../../../lib/markdown";
import { contentLanguageFor, localeInfo, routableLocales, ui, type Translate } from "../../../../lib/i18n";

export function generateStaticParams() {
  return routableLocales().flatMap((l) => bundle().units.map((u) => ({ lang: l.code, unitId: u.id })));
}
export const dynamicParams = false;

/** Content that has not passed human review is labelled wherever it is offered. */
const REVIEWED = new Set(["approved", "published"]);

/**
 * States how trustworthy the text on this page is: a machine draft, or English
 * shown because the chosen language has no translation for some keys.
 */
function TextNotice({ dict, msg, pivotName }: { dict: Dictionary; msg: Translate; pivotName: string }) {
  const values = Object.values(dict);
  const fallback = values.some((v) => v.fallback);
  const machine = values.some((v) => !v.fallback && v.status === "machine_draft");
  if (!fallback && !machine) return null;
  return (
    <p className="banner">
      {machine && <>{msg("status.machineDraft")} </>}
      {fallback && <>{msg("status.fallback", { language: pivotName })}</>}
    </p>
  );
}

function renderBlock(block: Block, d: Dictionary, msg: Translate, unit: { id: string; version: string; concepts: string[] }) {
  switch (block.type) {
    case "explanation":
    case "summary":
      return <div className={block.type}><Markdown text={t(d, block.body)} /></div>;
    case "regional_note":
      return <aside className="note"><Markdown text={t(d, block.body)} /></aside>;
    case "pattern":
      return (
        <figure>
          <figcaption>{t(d, block.caption)}</figcaption>
          <div className="table-wrap">
            <table>
              <thead><tr>{block.columns.map((c, i) => <th key={i} scope="col">{t(d, c)}</th>)}</tr></thead>
              <tbody lang="de">
                {block.rows.map((row, ri) => (
                  <tr key={ri}>{row.map((cell, ci) => <td key={ci} className={ci === 1 ? "verb" : undefined}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      );
    case "examples":
      return (
        <>
          <h3>{t(d, block.title)}</h3>
          <ul className="examples">
            {block.items.map((e) => (
              <li key={e.id}>
                <GermanSentence example={e} />
                {e.gloss && <div className="gloss">{t(d, e.gloss)}</div>}
                {e.note && <div className="muted small">{inline(t(d, e.note))}</div>}
              </li>
            ))}
          </ul>
        </>
      );
    case "contrast":
      return (
        <>
          <h3>{t(d, block.title)}</h3>
          {block.pairs.map((p) => (
            <div key={p.id} className="contrast">
              <div className="pair"><GermanSentence example={p.a} /><GermanSentence example={p.b} /></div>
              <p className="small">{inline(t(d, p.point))}</p>
            </div>
          ))}
        </>
      );
    case "common_errors":
      return (
        <>
          <h3>{t(d, block.title)}</h3>
          <ul className="errors">
            {block.items.map((e) => (
              <li key={e.id}>
                {/* Wrong above right, each on its own rail: no arrow glyph to translate. */}
                <div className="pair">
                  <span lang="de" className="wrong"><s>{e.wrong}</s></span>
                  <span lang="de" className="right">{e.right}</span>
                </div>
                <div className="small muted">{inline(t(d, e.explanation))}</div>
              </li>
            ))}
          </ul>
        </>
      );
    case "exercises": {
      const text = Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v.text]));
      // Labels are resolved on the server: a client component cannot receive a function.
      const labels = {
        check: msg("exercise.check"),
        reset: msg("exercise.reset"),
        tryAgain: msg("exercise.tryAgain"),
        yourAnswer: msg("exercise.yourAnswer"),
        saveFailed: msg("exercise.saveFailed"),
        stale: msg("exercise.stale"),
      };
      return (
        <>
          <h2>{t(d, block.title)}</h2>
          {block.items.map((ex) => (
            <ExercisePlayer key={ex.id} exercise={ex} text={text} labels={labels} unit={unit} />
          ))}
        </>
      );
    }
  }
}

export default async function Lesson({ params }: { params: Promise<{ lang: string; unitId: string }> }) {
  const { lang, unitId } = await params;
  const b = bundle();
  const unit = b.units.find((u) => u.id === unitId);
  if (!unit) notFound();
  const msg = ui(lang);
  const contentLang = contentLanguageFor(lang);
  const pivotName = localeInfo("en").nativeName;
  const d = dictionaryFor(unit.id, unit, contentLang);
  const concepts = new Map(b.concepts.map((c) => [c.id, c]));
  const name = (id: string) => {
    const c = concepts.get(id);
    return c ? t(dictionaryFor(c.id, c, contentLang), c.title) : id;
  };

  // Exercises in this lesson, in order, for the on-device summary.
  const exerciseIds = unit.blocks.flatMap((block) => (block.type === "exercises" ? block.items.map((e) => e.id) : []));

  // The next lesson on the first route that contains this one; none if this is the last.
  let next: { href: string; title: string } | undefined;
  for (const route of b.routes) {
    const unitIds = route.steps.map((s) => s.unit).filter((u): u is string => !!u);
    const at = unitIds.indexOf(unit.id);
    if (at < 0) continue;
    const nextId = unitIds[at + 1];
    const nextUnit = nextId ? b.units.find((u) => u.id === nextId) : undefined;
    if (nextUnit) {
      next = { href: `/${lang}/learn/${nextUnit.id}`, title: t(dictionaryFor(nextUnit.id, nextUnit, contentLang), nextUnit.title) };
    }
    break;
  }

  return (
    <main className="page lesson">
      <p className="back"><Link href={`/${lang}`}>← {msg("nav.allTopics")}</Link></p>
      <h1>{t(d, unit.title)}</h1>
      <p className="lead">{t(d, unit.summary)}</p>
      <div className="meta">
        <span className="tag">{msg("catalog.unitMeta", { level: unit.cefr, minutes: unit.estimated_minutes })}</span>
        {!REVIEWED.has(unit.status) && <span className="tag warn">{msg("status.draftTag")}</span>}
      </div>
      {unit.review.linguistic.status !== "passed" && <p className="banner">{msg("status.notReviewed")}</p>}
      <TextNotice dict={d} msg={msg} pivotName={pivotName} />
      {unit.prerequisites.length > 0 && (
        <p className="muted">{msg("catalog.prerequisites")}: {unit.prerequisites.map(name).join(", ")}</p>
      )}
      <ul className="objectives">{unit.objectives.map((o) => <li key={o.id}>{inline(t(d, o.text))}</li>)}</ul>
      {unit.blocks.map((block) => (
        <section key={block.id} id={block.id}>
          {renderBlock(block, d, msg, { id: unit.id, version: unit.version, concepts: unit.concepts })}
        </section>
      ))}
      <LessonSummary lang={lang} unitId={unit.id} exerciseIds={exerciseIds} next={next} />
      <p className="banner">{msg("status.noPersistence")}</p>
    </main>
  );
}
