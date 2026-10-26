// Human-like bot typists. A bot's whole race is planned when the race starts, as timed keystrokes that the
// engine replays with the same typing rules as players: uneven rhythm, pauses between words, and typos
// that the bot sometimes notices a few keys late before deleting them and typing the right character.
// Typos follow the race's error mode (BOT-03): fixed after a reaction in blocking mode, left behind in free mode.
import type { BotDifficulty, RaceMode } from "@/types/lobby";
import type { InputEvent } from "@/types/race";
import { botTargetWpm } from "./lobby";

/** One planned keystroke, `atMs` after the race start. */
export type BotStep = { atMs: number; event: InputEvent };

type BotProfile = {
  /** Chance of hitting a wrong key on each character. */
  mistakeRate: number;
  /** Chance, after a typo, of typing one more character before noticing it (repeated, up to 3 characters). */
  lateNoticeRate: number;
  /** How uneven the rhythm is; 0 would be a metronome. */
  rhythmSpread: number;
  /** Chance of a short pause before starting a word. */
  hesitationRate: number;
  /** Time to notice a typo and react, in ms. */
  reactionMs: readonly [number, number];
};

export const botDifficulties: readonly BotDifficulty[] = ["noob", "novice", "rookie", "master", "godspeed"];

// Typo rates follow the assignment's table (about 12%, 8%, 5%, 2% and 0.5%).
const botProfiles: Record<BotDifficulty, BotProfile> = {
  noob: { mistakeRate: 0.12, lateNoticeRate: 0.6, rhythmSpread: 0.7, hesitationRate: 0.2, reactionMs: [500, 1100] },
  novice: { mistakeRate: 0.08, lateNoticeRate: 0.55, rhythmSpread: 0.6, hesitationRate: 0.15, reactionMs: [400, 900] },
  rookie: { mistakeRate: 0.05, lateNoticeRate: 0.45, rhythmSpread: 0.5, hesitationRate: 0.08, reactionMs: [300, 700] },
  master: { mistakeRate: 0.02, lateNoticeRate: 0.3, rhythmSpread: 0.35, hesitationRate: 0.04, reactionMs: [200, 450] },
  godspeed: { mistakeRate: 0.005, lateNoticeRate: 0.2, rhythmSpread: 0.25, hesitationRate: 0.02, reactionMs: [150, 350] },
};

/** A bot's speed varies from race to race by up to this share of its target. */
const FORM_VARIATION = 0.08;
/** Time to read the first word before the first keystroke, in ms. */
const FIRST_KEY_MS: readonly [number, number] = [250, 650];
const HESITATION_MS: readonly [number, number] = [250, 800];

export function isBotDifficulty(value: unknown): value is BotDifficulty {
  return typeof value === "string" && (botDifficulties as readonly string[]).includes(value);
}

function between(random: () => number, [min, max]: readonly [number, number]): number {
  return min + random() * (max - min);
}

const keyboardRows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const commonLetters = [..."etaoinsrhl"];

/** Keys around `key` on a QWERTY keyboard; empty for keys not on the letter rows. */
function neighborKeys(key: string): string[] {
  for (const [row, keys] of keyboardRows.entries()) {
    const column = keys.indexOf(key);
    if (column === -1) continue;
    return [keys[column - 1], keys[column + 1], keyboardRows[row - 1]?.[column], keyboardRows[row + 1]?.[column]].filter(
      (neighbor): neighbor is string => neighbor !== undefined,
    );
  }
  return [];
}

/** A plausible wrong key: a neighbor of the expected letter, or a common letter. Keeps the expected case. */
export function wrongKeyFor(expected: string, random: () => number): string {
  const lower = expected.toLowerCase();
  const neighbors = neighborKeys(lower);
  const pool = neighbors.length > 0 ? neighbors : commonLetters.filter((letter) => letter !== lower);
  const key = pool[Math.floor(random() * pool.length)];
  return expected === lower ? key : key.toUpperCase();
}

/** Relative time a key takes: capitals and punctuation are slower, and every key varies a bit. */
function keyEffort(char: string, profile: BotProfile, random: () => number): number {
  const noise = (random() + random() + random() - 1.5) * profile.rhythmSpread;
  const isSlowKey = char !== char.toLowerCase() || /[^\p{L}\p{N}\s]/u.test(char);
  return Math.max(0.3, (1 + noise) * (isSlowKey ? 1.5 : 1));
}

/** Small seeded generator (mulberry32), so bot plans made during a race stay reproducible (BOT-05). */
export function seededRandom(seed: number): () => number {
  let value = seed | 0;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/**
 * Plans the rest of a bot's race after its text changed (a bonus added or removed words): first erases what it got
 * wrong (except in free mode, where mistakes stay), then types the rest of the new text. Times start at `fromMs`.
 */
export function replanBotRun(
  text: string,
  typed: string,
  difficulty: BotDifficulty,
  random: () => number,
  mode: RaceMode,
  fromMs: number,
): BotStep[] {
  let kept = typed.length;
  if (mode !== "free") while (kept > 0 && typed.slice(0, kept) !== text.slice(0, kept)) kept--;
  const deletes: BotStep[] = Array.from({ length: typed.length - kept }, (_, index) => ({ atMs: fromMs + (index + 1) * 120, event: { type: "delete" } }));
  const start = (deletes.at(-1)?.atMs ?? fromMs);
  const rest = planBotRun(text.slice(kept), difficulty, random, mode).map((step) => ({ ...step, atMs: start + step.atMs }));
  return [...deletes, ...rest];
}

/**
 * A spell on a bot: from `fromMs` (after the race start), the bot types at `speed` (0 to 1) of its pace for `durationMs`,
 * then at its own pace again. Speed 0 freezes it (a stun); a hex only slows it, like a player squinting at blurred
 * words. Keys already typed (`applied`) keep their time.
 */
export function slowBotSteps(steps: readonly BotStep[], applied: number, fromMs: number, durationMs: number, speed: number): BotStep[] {
  const slowWork = durationMs * speed;
  return steps.map((step, index) => {
    if (index < applied) return step;
    const work = Math.max(0, step.atMs - fromMs);
    const elapsed = work < slowWork ? work / speed : work + durationMs - slowWork;
    return { ...step, atMs: Math.round(fromMs + elapsed) };
  });
}

/**
 * Plans a bot's race over `text`. The pace is scaled so the bot finishes at about its target speed
 * (varied per race), while typos and pauses still slow it down where they happen.
 */
export function planBotRun(text: string, difficulty: BotDifficulty, random: () => number, mode: RaceMode = "normal"): BotStep[] {
  if (text.length === 0) return [];
  const profile = botProfiles[difficulty];
  const wpm = botTargetWpm[difficulty] * between(random, [1 - FORM_VARIATION, 1 + FORM_VARIATION]);

  // Unscaled plan: time is counted in "key efforts".
  const presses: { at: number; char: string | null }[] = [];
  let time = 0;
  const press = (char: string | null, wait: number) => {
    time += wait;
    presses.push({ at: time, char });
  };
  const efforts = Array.from({ length: text.length }, (_, index) => keyEffort(text[index], profile, random));
  const meanEffort = efforts.reduce((sum, effort) => sum + effort, 0) / efforts.length;
  const pause = (range: readonly [number, number]) => (between(random, range) / (12_000 / wpm)) * meanEffort;

  for (let index = 0; index < text.length; index++) {
    if (text[index - 1] === " " && random() < profile.hesitationRate) time += pause(HESITATION_MS);

    if (random() < profile.mistakeRate) {
      press(wrongKeyFor(text[index], random), efforts[index]);
      // Free mode: the typo stays and the bot moves on.
      if (mode === "free") continue;
      // Blocking mode: the cursor did not move, so the bot just reacts and types the right key.
      if (mode === "blocking") {
        time += pause(profile.reactionMs);
        press(text[index], efforts[index]);
        continue;
      }
      let extra = 0;
      while (extra < 3 && index + 1 + extra < text.length && random() < profile.lateNoticeRate) {
        press(text[index + 1 + extra], efforts[index + 1 + extra]);
        extra++;
      }
      time += pause(profile.reactionMs);
      for (let count = 0; count <= extra; count++) press(null, meanEffort * between(random, [0.5, 0.9]));
    }
    press(text[index], efforts[index]);
  }

  // Scale so the whole text takes as long as typing it cleanly at `wpm`.
  const msPerEffort = (text.length * (12_000 / wpm)) / time;
  const firstKeyMs = between(random, FIRST_KEY_MS);
  let previousAt = 0;
  return presses.map(({ at, char }) => {
    const delayMs = Math.round((at - previousAt) * msPerEffort);
    previousAt = at;
    const atMs = Math.round(firstKeyMs + at * msPerEffort);
    return { atMs, event: char === null ? { type: "delete" } : { type: "char", char, delayMs } };
  });
}
