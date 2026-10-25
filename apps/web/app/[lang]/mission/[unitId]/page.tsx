import { notFound } from "next/navigation";
import { unitExercises } from "@deutschgo/content-kit";
import { LessonFlow, type FlowStep } from "../../../../components/LessonFlow";
import { bundle, dictionaryFor, t } from "../../../../lib/content";
import { scenarioMissions } from "../../../../lib/missions";
import { contentLanguageFor, routableLocales, ui } from "../../../../lib/i18n";

export function generateStaticParams() {
  const b = bundle();
  const ids = new Set(scenarioMissions(b, () => "").map((mission) => mission.unitId));
  return routableLocales().flatMap((locale) => [...ids].map((unitId) => ({ lang: locale.code, unitId })));
}
export const dynamicParams = false;

export default async function Mission({ params }: { params: Promise<{ lang: string; unitId: string }> }) {
  const { lang, unitId } = await params;
  const b = bundle();
  const unit = b.units.find((candidate) => candidate.id === unitId);
  if (!unit) notFound();
  const msg = ui(lang);
  const contentLang = contentLanguageFor(lang);
  const pivotName = b.languages.find((language) => language.code === b.pivot)?.name ?? "English";
  const dictionary = dictionaryFor(unit.id, unit, contentLang);
  const hasFallback = Object.values(dictionary).some((value) => value.fallback);
  const text = Object.fromEntries(Object.entries(dictionary).map(([key, value]) => [key, value.text]));
  const exercises = unitExercises(unit).filter((exercise) => exercise.type === "reply_choice");
  if (!exercises.length) notFound();
  const steps: FlowStep[] = [
    { kind: "learn", id: "mission-intro", content: <><h1>{msg("mission.start")}: {t(dictionary, unit.title)}</h1><p className="lead">{t(dictionary, unit.summary)}</p>{unit.status !== "approved" && unit.status !== "published" && <p className="banner">{msg("status.notReviewed")}</p>}{hasFallback && <p className="banner">{msg("status.fallback", { language: pivotName })}</p>}<p className="muted">{msg("mission.feedback")}</p></> },
    ...exercises.map((exercise) => ({ kind: "exercise" as const, id: exercise.id, exercise, caption: msg("mission.title") })),
  ];
  return <LessonFlow lang={lang} unit={{ id: unit.id, version: unit.version, concepts: unit.concepts, title: t(dictionary, unit.title), reviewed: unit.status === "approved" || unit.status === "published" }} steps={steps} text={text} saveNotice={{ notSaved: msg("status.noPersistence"), saved: msg("account.savedNote") }} />;
}
