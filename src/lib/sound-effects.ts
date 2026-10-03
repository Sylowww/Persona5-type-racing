// Synthesized sound effects (Web Audio API, browser only): no audio files, so nothing to license or download.
// Muting is shared with the background music through `setSoundMuted`, called by the header's mute button.

const MASTER_VOLUME = 0.6;

type SoundWindow = Window & {
  __typeStrikeSound?: { context: AudioContext; master: GainNode; noise: AudioBuffer };
  __typeStrikeMuted?: boolean;
  /** Background music element, owned by the header's music player. */
  __typeStrikeMusic?: HTMLAudioElement;
  /** Voice line playing now, and the music volume to restore once it ends. */
  __typeStrikeVoice?: { audio: HTMLAudioElement; musicVolume: number | null };
};

/** Called by the mute button; effects already playing fade out with it. */
export function setSoundMuted(muted: boolean) {
  const soundWindow = window as SoundWindow;
  soundWindow.__typeStrikeMuted = muted;
  if (muted) soundWindow.__typeStrikeVoice?.audio.pause();
  const engine = soundWindow.__typeStrikeSound;
  if (engine) engine.master.gain.setTargetAtTime(muted ? 0 : MASTER_VOLUME, engine.context.currentTime, 0.05);
}

/** Brown noise: deep and soft, the base of every rumble and crash. */
function createNoise(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let index = 0; index < data.length; index++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[index] = last * 3.5;
  }
  return buffer;
}

/** The shared engine, created on first use (kept on window so a remount or hot reload reuses it). */
function engine() {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") return null;
  const soundWindow = window as SoundWindow;
  if (soundWindow.__typeStrikeMuted) return null;
  if (!soundWindow.__typeStrikeSound) {
    const context = new AudioContext();
    const master = context.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(context.destination);
    soundWindow.__typeStrikeSound = { context, master, noise: createNoise(context) };
  }
  const sound = soundWindow.__typeStrikeSound;
  // Browsers start the context suspended until the visitor interacts; by the race they have.
  if (sound.context.state === "suspended") sound.context.resume().catch(() => undefined);
  return sound;
}

/** Filtered noise with an attack/decay envelope. */
function noiseBurst(options: {
  delay?: number;
  duration: number;
  volume: number;
  filter: BiquadFilterType;
  frequency: number;
  endFrequency?: number;
}) {
  const sound = engine();
  if (!sound) return;
  const { context, master, noise } = sound;
  const start = context.currentTime + (options.delay ?? 0);
  const end = start + options.duration;

  const source = context.createBufferSource();
  source.buffer = noise;
  source.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = options.filter;
  filter.frequency.setValueAtTime(options.frequency, start);
  if (options.endFrequency) filter.frequency.exponentialRampToValueAtTime(options.endFrequency, end);
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(options.volume, start + Math.min(0.06, options.duration / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  source.connect(filter).connect(gain).connect(master);
  source.start(start, Math.random() * 1.5);
  source.stop(end + 0.05);
}

/** A low sine that drops in pitch: the body of an impact. */
function thump(options: { delay?: number; volume: number; from: number; to: number; duration: number }) {
  const sound = engine();
  if (!sound) return;
  const { context, master } = sound;
  const start = context.currentTime + (options.delay ?? 0);
  const end = start + options.duration;

  const oscillator = context.createOscillator();
  oscillator.frequency.setValueAtTime(options.from, start);
  oscillator.frequency.exponentialRampToValueAtTime(options.to, end);
  const gain = context.createGain();
  gain.gain.setValueAtTime(options.volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  oscillator.connect(gain).connect(master);
  oscillator.start(start);
  oscillator.stop(end + 0.05);
}

/** Small stones hitting the floor at random moments. */
function clatter(count: number, spreadSeconds: number, volume: number) {
  for (let index = 0; index < count; index++) {
    noiseBurst({
      delay: Math.random() * spreadSeconds,
      duration: 0.04 + Math.random() * 0.08,
      volume: volume * (0.4 + Math.random() * 0.6),
      filter: "bandpass",
      frequency: 900 + Math.random() * 2500,
    });
  }
}

/** A deep rumble; `strength` from 0 to 1 sets its loudness, depth and the debris heard with it. */
export function playRumble(strength: number, durationMs: number) {
  const level = Math.min(1, Math.max(0, strength));
  noiseBurst({
    duration: durationMs / 1000 + 0.3,
    volume: 0.25 + 0.55 * level,
    filter: "lowpass",
    frequency: 140 + 120 * level,
    endFrequency: 60,
  });
  if (level > 0.35) thump({ volume: 0.25 * level, from: 70, to: 35, duration: 0.35 });
  clatter(Math.round(2 + 6 * level), durationMs / 1000 + 0.4, 0.05 + 0.08 * level);
}

/** The palace giving way at the end of the race; `slamDelayMs` times the closing impact. */
export function playFinalCollapse(slamDelayMs: number) {
  noiseBurst({ duration: 2.4, volume: 0.9, filter: "lowpass", frequency: 320, endFrequency: 70 });
  thump({ volume: 0.5, from: 90, to: 30, duration: 0.8 });
  clatter(22, 1.6, 0.16);
  const slam = slamDelayMs / 1000;
  thump({ delay: slam, volume: 0.9, from: 110, to: 28, duration: 0.7 });
  noiseBurst({ delay: slam, duration: 0.5, volume: 0.6, filter: "lowpass", frequency: 900, endFrequency: 80 });
}

/** The wedges opening on the results page. */
export function playReveal() {
  noiseBurst({ duration: 0.55, volume: 0.35, filter: "bandpass", frequency: 300, endFrequency: 2400 });
  thump({ volume: 0.3, from: 60, to: 40, duration: 0.3 });
}

/** A short, high "talking" blip played while a cut-in line is typed out. */
export function playVoiceBlip() {
  const sound = engine();
  if (!sound) return;
  const { context, master } = sound;
  const start = context.currentTime;
  const oscillator = context.createOscillator();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(820 + Math.random() * 260, start);
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.05, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.045);
  oscillator.connect(gain).connect(master);
  oscillator.start(start);
  oscillator.stop(start + 0.06);
}

/** The cut-in band slamming onto the screen. */
export function playCutInSwoosh() {
  noiseBurst({ duration: 0.25, volume: 0.3, filter: "bandpass", frequency: 2600, endFrequency: 500 });
  thump({ delay: 0.12, volume: 0.25, from: 140, to: 60, duration: 0.18 });
}

const VOICE_VOLUME = 1;
/** Music volume while a voice line plays, so the line is easy to hear. */
const DUCKED_MUSIC_VOLUME = 0.1;

/** Plays a recorded voice line (a file in `public/voices/`), lowering the background music while it plays. */
export function playVoiceLine(src: string) {
  if (typeof window === "undefined") return;
  const soundWindow = window as SoundWindow;
  if (soundWindow.__typeStrikeMuted) return;

  const music = soundWindow.__typeStrikeMusic;
  const previous = soundWindow.__typeStrikeVoice;
  previous?.audio.pause();
  // A line cut short by a new one keeps the volume from before the first line.
  const musicVolume = previous ? previous.musicVolume : (music?.volume ?? null);

  const audio = new Audio(src);
  audio.volume = VOICE_VOLUME;
  const voice = { audio, musicVolume };
  soundWindow.__typeStrikeVoice = voice;
  if (music && musicVolume !== null) music.volume = Math.min(musicVolume, DUCKED_MUSIC_VOLUME);

  const restore = () => {
    if (soundWindow.__typeStrikeVoice !== voice) return;
    soundWindow.__typeStrikeVoice = undefined;
    if (music && musicVolume !== null) music.volume = musicVolume;
  };
  audio.addEventListener("ended", restore);
  audio.addEventListener("pause", restore);
  audio.addEventListener("error", restore);
  audio.play().catch(restore);
}

/** Plays a recorded sound effect (a file in `public/sfx/`), unless sound is muted. */
export function playSoundFile(src: string, volume = 0.8) {
  if (typeof window === "undefined" || (window as SoundWindow).__typeStrikeMuted) return;
  const audio = new Audio(src);
  audio.volume = volume;
  audio.play().catch(() => undefined);
}
