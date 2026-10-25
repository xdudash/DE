import Link from "next/link";
import { graphFromBundle } from "@deutschgo/learning-engine";
import { PracticeList, type TargetLink } from "../../../components/PracticeList";
import { bundle, dictionaryFor, t } from "../../../lib/content";
import { contentLanguageFor, ui } from "../../../lib/i18n";
import { scenarioMissions } from "../../../lib/missions";

export default async function Practice({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const msg = ui(lang);
  const contentLang = contentLanguageFor(lang);
  const b = bundle();
  const title = (id: string, entity: unknown, key: string) => t(dictionaryFor(id, entity, contentLang), key);

  // A topic is practised in the lesson that teaches it; without one, the map entry
  // is the only honest destination.
  const unitForConcept = new Map<string, string>();
  for (const u of b.units) for (const c of u.concepts) if (!unitForConcept.has(c)) unitForConcept.set(c, u.id);

  const targets: Record<string, TargetLink> = {};
  for (const c of b.concepts) {
    const unitId = unitForConcept.get(c.id);
    targets[c.id] = {
      title: title(c.id, c, c.title),
      href: unitId ? `/${lang}/learn/${unitId}` : `/${lang}/map#${c.id}`,
    };
  }

  return (
    <main className="page">
      <h1>{msg("practice.title")}</h1>
      <p className="lead">{msg("practice.lead")}</p>
      <Link href={`/${lang}/writing`} className="card practice-writing-link">
        <span className="pill blue">{msg("practice.writingTitle")}</span>
        <span>{msg("practice.writingDescription")}</span>
        <strong>{msg("practice.writingCta")} →</strong>
      </Link>
      <Link href={`/${lang}/speaking`} className="card practice-writing-link"><span className="pill blue">{msg("practice.speakingTitle")}</span><span>{msg("practice.speakingDescription")}</span><strong>{msg("practice.speakingCta")} →</strong></Link>
      <PracticeList lang={lang} graph={graphFromBundle(b)} targets={targets} missions={scenarioMissions(b, (id, ref) => title(id, b.units.find((u) => u.id === id), ref))} />
    </main>
  );
}
