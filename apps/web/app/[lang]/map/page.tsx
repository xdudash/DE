import Link from "next/link";
import { graphFromBundle } from "@deutschgo/learning-engine";
import { ConceptMap, type MapItem } from "../../../components/ConceptMap";
import { bundle, dictionaryFor, t } from "../../../lib/content";
import { contentLanguageFor, localeInfo, ui } from "../../../lib/i18n";

export default async function KnowledgeMap({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const msg = ui(lang);
  const contentLang = contentLanguageFor(lang);
  const b = bundle();
  const title = (id: string, entity: unknown, key: string) => t(dictionaryFor(id, entity, contentLang), key);
  const byId = new Map(b.concepts.map((c) => [c.id, c]));
  const unitForConcept = new Map<string, string>();
  for (const unit of b.units) for (const conceptId of unit.concepts) if (!unitForConcept.has(conceptId)) unitForConcept.set(conceptId, unit.id);

  const items: MapItem[] = b.concepts.map((c) => ({
    id: c.id,
    title: title(c.id, c, c.title),
    level: c.cefr.introduced,
    planned: c.status === "planned",
    category: c.kind === "grammar" || c.kind === "morphology" ? "grammar" : c.kind === "lexeme_sense" || c.kind === "collocation" ? "words" : "other",
    href: unitForConcept.has(c.id) ? `/${lang}/learn/${unitForConcept.get(c.id)}` : `/${lang}/map#${c.id}`,
    startable: unitForConcept.has(c.id),
    prerequisites: (c.relations ?? [])
      .filter((r) => r.type === "depends_on")
      .map((r) => byId.get(r.target))
      .filter((x): x is NonNullable<typeof x> => !!x)
      .map((x) => ({
        id: x.id,
        title: title(x.id, x, x.title),
        href: unitForConcept.has(x.id) ? `/${lang}/learn/${unitForConcept.get(x.id)}` : `/${lang}/map#${x.id}`,
      })),
  }));

  return (
    <main className="page">
      <h1>{msg("nav.knowledgeMap")}</h1>
      <p className="muted">{msg("catalog.conceptCount", { count: b.concepts.length })}</p>
      {localeInfo(lang).preview && (
        <p className="banner">{msg("status.fallback", { language: "English" })}</p>
      )}
      <div className="map-actions"><Link className="btn btn-secondary" href={"/" + lang + "/routes"}>{msg("nav.route")}</Link></div>
      <ConceptMap lang={lang} items={items} graph={graphFromBundle(b)} />
    </main>
  );
}
