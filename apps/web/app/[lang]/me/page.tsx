import { graphFromBundle } from "@deutschgo/learning-engine";
import { ProfilePanel } from "../../../components/ProfilePanel";
import { ProgressPanel } from "../../../components/ProgressPanel";
import { bundle } from "../../../lib/content";
import { ui } from "../../../lib/i18n";

export default async function You({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const msg = ui(lang);
  const b = bundle();

  return (
    <main className="page">
      <h1>{msg("profile.title")}</h1>
      <ProgressPanel lang={lang} graph={graphFromBundle(b)} totalTopics={b.concepts.length} />
      <ProfilePanel lang={lang} />
    </main>
  );
}
