import { WritingStudio } from "../../../components/WritingStudio";
import { ui } from "../../../lib/i18n";

export default async function WritingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const msg = ui(lang);
  const prompts = [
    { id: "neighbor", title: msg("writing.prompt.neighbor.title"), level: "A1", situation: msg("writing.prompt.neighbor.situation"), tasks: [msg("writing.prompt.neighbor.task1"), msg("writing.prompt.neighbor.task2"), msg("writing.prompt.neighbor.task3")] },
    { id: "appointment", title: msg("writing.prompt.appointment.title"), level: "A2", situation: msg("writing.prompt.appointment.situation"), tasks: [msg("writing.prompt.appointment.task1"), msg("writing.prompt.appointment.task2"), msg("writing.prompt.appointment.task3")] },
    { id: "colleague", title: msg("writing.prompt.colleague.title"), level: "A2", situation: msg("writing.prompt.colleague.situation"), tasks: [msg("writing.prompt.colleague.task1"), msg("writing.prompt.colleague.task2"), msg("writing.prompt.colleague.task3")] },
  ];
  const labels = {
    choosePrompt: msg("writing.choosePrompt"), situation: msg("writing.situation"), tasks: msg("writing.tasks"), answer: msg("writing.answer"),
    placeholder: msg("writing.placeholder"), wordCount: msg("writing.wordCount", { count: "{count}" }), noGrade: msg("writing.noGrade"), localOnly: msg("writing.localOnly"),
    selfReview: msg("writing.selfReview"), markReviewed: msg("writing.markReviewed"), reviewed: msg("writing.reviewed"), reset: msg("writing.reset"),
    saved: msg("writing.saved"), saveError: msg("writing.saveError"), draftStarted: msg("writing.draftStarted"), draftEmpty: msg("writing.draftEmpty"),
  };
  const criteria = [msg("writing.criterion1"), msg("writing.criterion2"), msg("writing.criterion3"), msg("writing.criterion4")];
  return (
    <main className="page writing-page">
      <p className="eyebrow">{msg("writing.kicker")}</p>
      <h1>{msg("writing.title")}</h1>
      <p className="lead">{msg("writing.lead")}</p>
      <WritingStudio lang={lang} labels={labels} prompts={prompts} criteria={criteria} />
    </main>
  );
}
