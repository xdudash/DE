import Link from "next/link";
import { notFound } from "next/navigation";
import type { Block } from "@deutschgo/content-kit";
import { ExercisePlayer } from "../../../../components/ExercisePlayer";
import { GermanSentence } from "../../../../components/GermanSentence";
import { bundle, dictionaryFor, explanationLanguages, t, type Dictionary } from "../../../../lib/content";
import { Markdown, inline } from "../../../../lib/markdown";
import { ui, type UiStrings } from "../../../../lib/ui-strings";

export function generateStaticParams() {
  return explanationLanguages().flatMap((l) => bundle().units.map((u) => ({ lang: l.code, unitId: u.id })));
}
export const dynamicParams = false;

function TextNotice({ dict, s }: { dict: Dictionary; s: UiStrings }) {
  const values = Object.values(dict);
  const fallback = values.some((v) => v.fallback);
  const machine = values.some((v) => !v.fallback && v.status === "machine_draft");
  if (!fallback && !machine) return null;
  return (
    <p className="banner">
      {machine && <>{s.machineDraft} </>}
      {fallback && <>{s.fallback}</>}
    </p>
  );
}

function renderBlock(block: Block, d: Dictionary, s: UiStrings) {
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
                <span lang="de" className="wrong"><s>{e.wrong}</s></span> → <span lang="de" className="right">{e.right}</span>
                <div className="small">{inline(t(d, e.explanation))}</div>
              </li>
            ))}
          </ul>
        </>
      );
    case "exercises": {
      const text = Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v.text]));
      const labels = { check: s.check, reset: s.reset, tryAgain: s.tryAgain, yourAnswer: s.yourAnswer };
      return (
        <>
          <h2>{t(d, block.title)}</h2>
          {block.items.map((ex) => <ExercisePlayer key={ex.id} exercise={ex} text={text} labels={labels} />)}
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
  const s = ui(lang);
  const d = dictionaryFor(unit.id, unit, lang);
  const concepts = new Map(b.concepts.map((c) => [c.id, c]));
  const name = (id: string) => {
    const c = concepts.get(id);
    return c ? t(dictionaryFor(c.id, c, lang), c.title) : id;
  };

  return (
    <main className="page lesson">
      <p><Link href={`/${lang}`}>← {s.back}</Link></p>
      <h1>{t(d, unit.title)}</h1>
      <p className="lead">{t(d, unit.summary)}</p>
      <p>
        <span className="tag">{unit.cefr}</span> <span className="tag">{unit.estimated_minutes} {s.minutes}</span>{" "}
        <span className="tag warn">{s.status}: {unit.status}</span>
      </p>
      {unit.review.linguistic.status !== "passed" && <p className="banner">{s.notReviewed}</p>}
      <TextNotice dict={d} s={s} />
      {unit.prerequisites.length > 0 && <p className="muted">{s.prerequisites}: {unit.prerequisites.map(name).join(", ")}</p>}
      <ul className="objectives">{unit.objectives.map((o) => <li key={o.id}>{inline(t(d, o.text))}</li>)}</ul>
      {unit.blocks.map((block) => <section key={block.id} id={block.id}>{renderBlock(block, d, s)}</section>)}
      <p className="banner">{s.noPersistence}</p>
    </main>
  );
}
