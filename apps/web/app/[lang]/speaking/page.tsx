import { SpeakingWorkshop } from "../../../components/SpeakingWorkshop";
import { ui } from "../../../lib/i18n";

export default async function SpeakingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const msg = ui(lang);
  const prompts = [
    { id: "cafe", title: msg("speaking.cafe.title"), cue: msg("speaking.cafe.cue"), sentence: msg("speaking.cafe.sentence") },
    { id: "appointment", title: msg("speaking.appointment.title"), cue: msg("speaking.appointment.cue"), sentence: msg("speaking.appointment.sentence") },
    { id: "introduction", title: msg("speaking.introduction.title"), cue: msg("speaking.introduction.cue"), sentence: msg("speaking.introduction.sentence") },
  ];
  const labels = {
    consent: msg("speaking.consent"), consentNote: msg("speaking.consentNote"), record: msg("speaking.record"), stop: msg("speaking.stop"),
    playback: msg("speaking.playback"), discard: msg("speaking.discard"), speakPrompt: msg("speaking.speakPrompt"),
    unsupported: msg("speaking.unsupported"), recording: msg("speaking.recording"), ready: msg("speaking.ready"),
    noRecording: msg("speaking.noRecording"), localOnly: msg("speaking.localOnly"), noScore: msg("speaking.noScore"),
    permissionError: msg("speaking.permissionError"), promptLabel: msg("speaking.promptLabel"),
  };
  return <main className="page speaking-page"><p className="eyebrow">{msg("speaking.kicker")}</p><h1>{msg("speaking.title")}</h1><p className="lead">{msg("speaking.lead")}</p><SpeakingWorkshop prompts={prompts} labels={labels} /></main>;
}
