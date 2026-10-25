"use client";

import { useEffect, useRef, useState } from "react";

type Prompt = { id: string; title: string; cue: string; sentence: string };
type Labels = Record<"consent"|"consentNote"|"record"|"stop"|"playback"|"discard"|"speakPrompt"|"unsupported"|"recording"|"ready"|"noRecording"|"localOnly"|"noScore"|"permissionError"|"promptLabel", string>;

export function SpeakingWorkshop({ prompts, labels }: { prompts: Prompt[]; labels: Labels }) {
  const [active, setActive] = useState(0);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const prompt = prompts[active];

  useEffect(() => () => {
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((track) => track.stop());
  }, []);

  if (!prompt) return null;

  function discard() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl("");
    chunks.current = [];
  }
  function sayPrompt() {
    if (!prompt) return;
    if (!("speechSynthesis" in window)) { setError(true); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(prompt.sentence);
    utterance.lang = "de-DE";
    window.speechSynthesis.speak(utterance);
  }
  async function startRecording() {
    setError(false);
    if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) { setError(true); return; }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      chunks.current = [];
      const instance = new MediaRecorder(media);
      recorder.current = instance;
      instance.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      instance.onstop = () => {
        setAudioUrl(URL.createObjectURL(new Blob(chunks.current, { type: instance.mimeType || "audio/webm" })));
        media.getTracks().forEach((track) => track.stop());
        stream.current = null;
      };
      instance.start();
      setRecording(true);
    } catch { setError(true); }
  }
  function stopRecording() { recorder.current?.stop(); setRecording(false); }
  return <section className="speaking-workshop">
    <div className="speaking-prompts" aria-label={labels.promptLabel}>{prompts.map((item,i)=><button key={item.id} type="button" className={active===i?"speaking-prompt active":"speaking-prompt"} aria-pressed={active===i} disabled={recording} onClick={()=>{discard();setActive(i);}}><span className="pill">{i+1}</span><strong>{item.title}</strong></button>)}</div>
    <article className="card speaking-cue"><span className="pill blue">{labels.promptLabel}</span><h2>{prompt.title}</h2><p>{prompt.cue}</p><p className="speaking-german" lang="de">{prompt.sentence}</p><button type="button" className="button secondary" onClick={sayPrompt}>{labels.speakPrompt}</button></article>
    <section className="card speaking-record"><h2>{labels.consent}</h2><p>{labels.consentNote}</p><p className="muted small">{labels.localOnly} {labels.noScore}</p><div aria-live="polite" className="speaking-status">{recording?labels.recording:audioUrl?labels.playback:labels.ready}</div>{error&&<p role="alert">{labels.permissionError} {labels.unsupported}</p>}{recording?<button type="button" className="button primary" onClick={stopRecording}>{labels.stop}</button>:<button type="button" className="button primary" onClick={startRecording}>{labels.record}</button>}{audioUrl?<div className="speaking-audio"><audio controls src={audioUrl}>{labels.unsupported}</audio><button type="button" className="button secondary" onClick={discard}>{labels.discard}</button></div>:<p className="muted small">{labels.noRecording}</p>}</section>
  </section>;
}
