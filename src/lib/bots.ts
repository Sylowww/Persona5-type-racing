// Human-like bot typists. A bot's whole race is planned when the race starts, as timed keystrokes that the
// engine replays with the same typing rules as players: uneven rhythm, pauses between words, and typos
// that the bot sometimes notices a few keys late before deleting them and typing the right character.
import type { BotDifficulty } from "@/types/lobby";
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

export const botDifficulties: readonly BotDifficulty[] = ["rookie", "master", "godspeed"];

const botProfiles: Record<BotDifficulty, BotProfile> = {
  rookie: { mistakeRate: 0.05, lateNoticeRate: 0.45, rhythmSpread: 0.5, hesitationRate: 0.08, reactionMs: [300, 700] },
  master: { mistakeRate: 0.025, lateNoticeRate: 0.3, rhythmSpread: 0.35, hesitationRate: 0.04, reactionMs: [200, 450] },
  godspeed: { mistakeRate: 0.012, lateNoticeRate: 0.2, rhythmSpread: 0.25, hesitationRate: 0.02, reactionMs: [150, 350] },
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

/**
 * Plans a bot's race over `text`. The pace is scaled so the bot finishes at about its target speed
 * (varied per race), while typos and pauses still slow it down where they happen.
 */
export function planBotRun(text: string, difficulty: BotDifficulty, random: () => number): BotStep[] {
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
