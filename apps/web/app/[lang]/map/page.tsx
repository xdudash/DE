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

  const items: MapItem[] = b.concepts.map((c) => ({
    id: c.id,
    title: title(c.id, c, c.title),
    level: c.cefr.introduced,
    planned: c.status === "planned",
    prerequisites: (c.relations ?? [])
      .filter((r) => r.type === "depends_on")
      .map((r) => byId.get(r.target))
      .filter((x): x is NonNullable<typeof x> => !!x)
      .map((x) => title(x.id, x, x.title)),
  }));

  return (
    <main className="page">
      <h1>{msg("nav.knowledgeMap")}</h1>
      <p className="muted">{msg("catalog.conceptCount", { count: b.concepts.length })}</p>
      {localeInfo(lang).preview && (
        <p className="banner">{msg("status.fallback", { language: "English" })}</p>
      )}
      <ConceptMap lang={lang} items={items} graph={graphFromBundle(b)} />
    </main>
  );
}
