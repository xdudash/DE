/**
 * Short interface tones for lesson feedback, synthesised with Web Audio: no audio files,
 * nothing to download, nothing sent anywhere. Off when the learner turned sound off on
 * this device. Failure is silent by design: a tone is a nicety, never information the
 * learner depends on (every result is also shown as text).
 */
import { readSound } from "./device-state";

type Cue = "right" | "wrong" | "arrive";

const NOTES: Record<Cue, { freq: number; at: number; len: number; type: OscillatorType }[]> = {
  right: [
    { freq: 659.25, at: 0, len: 0.09, type: "sine" },
    { freq: 987.77, at: 0.08, len: 0.16, type: "sine" },
  ],
  wrong: [
    { freq: 233.08, at: 0, len: 0.12, type: "triangle" },
    { freq: 196.0, at: 0.1, len: 0.2, type: "triangle" },
  ],
  arrive: [
    { freq: 523.25, at: 0, len: 0.12, type: "sine" },
    { freq: 659.25, at: 0.1, len: 0.12, type: "sine" },
    { freq: 783.99, at: 0.2, len: 0.12, type: "sine" },
    { freq: 1046.5, at: 0.3, len: 0.3, type: "sine" },
  ],
};

let context: AudioContext | null = null;

export function play(cue: Cue): void {
  try {
    if (!readSound()) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    context ??= new Ctx();
    const ctx = context;
    const start = ctx.currentTime + 0.01;
    for (const n of NOTES[cue]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type;
      osc.frequency.value = n.freq;
      gain.gain.setValueAtTime(0.0001, start + n.at);
      gain.gain.exponentialRampToValueAtTime(0.18, start + n.at + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + n.at + n.len);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start + n.at);
      osc.stop(start + n.at + n.len + 0.02);
    }
  } catch {
    // No audio device or autoplay policy: the text feedback already said everything.
  }
}
