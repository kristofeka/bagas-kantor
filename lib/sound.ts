// Semua suara dibuat langsung di browser dengan Web Audio, tanpa file audio.

export type SoundId = "bagas" | "laptop" | "mug" | "hp" | "jam" | "kalender" | "tanaman" | "sakti" | "pop";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

export const setSoundEnabled = (value: boolean) => {
  enabled = value;
  if (master && ctx) master.gain.setTargetAtTime(value ? 0.5 : 0, ctx.currentTime, 0.02);
  if (!value) stopLine();
};

// Browser baru mengizinkan audio setelah ada klik atau sentuhan dari pengunjung.
export const unlockSound = () => {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.5 : 0;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
};

const ready = () => (enabled && ctx && master && ctx.state === "running" ? { ctx, master } : null);

const tone = (
  type: OscillatorType,
  from: number,
  to: number,
  start: number,
  duration: number,
  volume: number,
) => {
  const audio = ready();
  if (!audio) return;
  const t = audio.ctx.currentTime + start;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(audio.master);
  osc.start(t);
  osc.stop(t + duration + 0.02);
};

const noise = (
  filter: BiquadFilterType,
  from: number,
  to: number,
  start: number,
  duration: number,
  volume: number,
) => {
  const audio = ready();
  if (!audio) return;
  const t = audio.ctx.currentTime + start;
  const length = Math.ceil(audio.ctx.sampleRate * duration);
  const buffer = audio.ctx.createBuffer(1, length, audio.ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const source = audio.ctx.createBufferSource();
  source.buffer = buffer;
  const biquad = audio.ctx.createBiquadFilter();
  biquad.type = filter;
  biquad.frequency.setValueAtTime(from, t);
  biquad.frequency.exponentialRampToValueAtTime(to, t + duration);
  const gain = audio.ctx.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  source.connect(biquad).connect(gain).connect(audio.master);
  source.start(t);
};

export const playSound = (id: SoundId) => {
  switch (id) {
    case "bagas":
      tone("triangle", 180, 420, 0, 0.16, 0.35);
      tone("triangle", 420, 240, 0.12, 0.14, 0.25);
      break;
    case "laptop":
      [0, 0.07, 0.13, 0.22, 0.28].forEach((at) => noise("bandpass", 2600, 1400, at, 0.035, 0.5));
      break;
    case "mug":
      tone("sine", 2100, 2050, 0, 0.35, 0.22);
      tone("sine", 3150, 3100, 0, 0.22, 0.1);
      break;
    case "hp":
      tone("sine", 880, 880, 0, 0.14, 0.25);
      tone("sine", 1318, 1318, 0.12, 0.26, 0.25);
      break;
    case "jam":
      tone("square", 1500, 900, 0, 0.03, 0.18);
      tone("square", 1100, 700, 0.28, 0.03, 0.18);
      break;
    case "kalender":
      noise("highpass", 900, 4200, 0, 0.2, 0.3);
      break;
    case "tanaman":
      noise("bandpass", 3200, 1200, 0, 0.16, 0.25);
      noise("bandpass", 2400, 3600, 0.12, 0.18, 0.2);
      break;
    case "sakti":
      [523, 659, 784, 1047].forEach((freq, index) => tone("triangle", freq, freq, index * 0.07, 0.22, 0.22));
      break;
    case "pop":
      tone("sine", 520, 260, 0, 0.09, 0.3);
      break;
  }
};

// Suara ngomong Bagas: gumaman pendek bernada rendah untuk tiap huruf.
export const playVoice = (char: string) => {
  const audio = ready();
  if (!audio || !/[a-z0-9]/i.test(char)) return;
  const vowel = /[aiueo]/i.test(char);
  const base = 118 + (char.toLowerCase().charCodeAt(0) % 7) * 9 + (vowel ? 22 : 0);
  const t = audio.ctx.currentTime;
  const osc = audio.ctx.createOscillator();
  const filter = audio.ctx.createBiquadFilter();
  const gain = audio.ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(base, t);
  osc.frequency.exponentialRampToValueAtTime(base * 0.9, t + 0.07);
  filter.type = "lowpass";
  filter.frequency.value = vowel ? 1100 : 700;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.28, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);
  osc.connect(filter).connect(gain).connect(audio.master);
  osc.start(t);
  osc.stop(t + 0.09);
};

// Klip suara Koda per kalimat. Kalimat yang belum punya klip memakai gumaman.
import manifest from "./vo.json";

const CLIPS = manifest as Record<string, { file: string; duration: number }>;
let current: HTMLAudioElement | null = null;

export const stopLine = () => {
  if (current) {
    current.pause();
    current = null;
  }
};

// Mengembalikan durasi klip (detik) bila suara Koda diputar, atau null bila tidak.
export const playLine = (text: string): number | null => {
  stopLine();
  const clip = CLIPS[text];
  if (!clip || !enabled || !ctx || ctx.state !== "running") return null;
  const audio = new Audio(clip.file);
  audio.volume = 0.9;
  current = audio;
  audio.play().catch(() => {});
  return clip.duration;
};
