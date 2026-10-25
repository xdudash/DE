import Link from "next/link";
import { graphFromBundle } from "@deutschgo/learning-engine";
import { ProgressActivity } from "../../../components/ProgressActivity";
import { ProgressPanel } from "../../../components/ProgressPanel";
import { bundle } from "../../../lib/content";
import { ui } from "../../../lib/i18n";

export default async function ProgressPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const msg = ui(lang);
  const b = bundle();
  const activityLabels = { title: msg("progress.activityTitle"), total: msg("progress.activityTotal", { count: "{count}" }), day: msg("progress.activityDay", { count: "{count}" }), empty: msg("progress.activityEmpty") };
  return (
    <main className="page progress-page">
      <p className="eyebrow">{msg("progress.title")}</p>
      <h1>{msg("progress.title")}</h1>
      <div className="progress-board"><ProgressPanel lang={lang} graph={graphFromBundle(b)} totalTopics={b.concepts.length} /><ProgressActivity lang={lang} labels={activityLabels} /></div>
      <nav className="progress-links" aria-label={msg("progress.title")}>
        <Link className="btn btn-secondary" href={"/" + lang}>{msg("home.start")}</Link>
        <Link className="btn btn-secondary" href={"/" + lang + "/map"}>{msg("nav.knowledgeMap")}</Link>
        <Link className="btn btn-secondary" href={"/" + lang + "/practice"}>{msg("practice.title")}</Link>
      </nav>
    </main>
  );
}
