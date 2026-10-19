// Catch-up bonuses (BONUS-01 to BONUS-04): pure rules, applied by the race engine. Kept apart from the engine so
// their exact behavior can change without touching the race model.

import type { BonusKind } from "@/types/race";

export const bonusKinds: readonly BonusKind[] = ["shortcut", "burden", "fog"];

/** Leader progress at which bonuses are handed out. */
export const BONUS_CHECKPOINTS: readonly number[] = [0.25, 0.5, 0.75];
/** A racer this far behind the leader (in share of the text) is lagging, as is the last racer. */
export const LAGGING_GAP = 0.25;
export const MAX_BONUSES_PER_RACER = 3;
export const BONUS_WORDS = 3;
export const FOG_MS = 5_000;
/** How long a bot leader hesitates under fog, since it cannot be blinded. */
export const BOT_FOG_DELAY_MS = 1_500;

/** Number of checkpoints passed by a leader at `leaderProgress`. */
export function checkpointsReached(leaderProgress: number): number {
  return BONUS_CHECKPOINTS.filter((checkpoint) => leaderProgress >= checkpoint).length;
}

type Contender = { id: string; progress: number; bonuses: number };

/**
 * Who gets a bonus at a checkpoint, among racers still typing: the last one and anyone more than `LAGGING_GAP`
 * behind the leader, never the leader, and at most `MAX_BONUSES_PER_RACER` per race. Returns the leader too, the
 * target of the bonuses that slow down the front of the race. Ties go to the racer listed first.
 */
export function pickBonusReceivers(contenders: readonly Contender[]): { leaderId: string | null; receiverIds: string[] } {
  if (contenders.length < 2) return { leaderId: null, receiverIds: [] };
  const leader = contenders.reduce((best, racer) => (racer.progress > best.progress ? racer : best));
  const last = contenders.reduce((worst, racer) => (racer.progress < worst.progress ? racer : worst));
  const receiverIds = contenders
    .filter((racer) => racer !== leader && racer.bonuses < MAX_BONUSES_PER_RACER)
    .filter((racer) => racer === last || leader.progress - racer.progress > LAGGING_GAP)
    .map((racer) => racer.id);
  return { leaderId: leader.id, receiverIds };
}

/** Bonus of one receiver at one checkpoint: rotates through the kinds so each lagging racer gets a mix. */
export function bonusFor(checkpoint: number, receiverIndex: number): BonusKind {
  return bonusKinds[(checkpoint + receiverIndex) % bonusKinds.length];
}

/** Word boundaries: start index of each word of `text`. */
function wordStarts(text: string): number[] {
  const starts: number[] = [];
  for (let index = 0; index < text.length; index++) if (text[index] !== " " && (index === 0 || text[index - 1] === " ")) starts.push(index);
  return starts;
}

/**
 * Removes up to `count` words from the end of `text`, never touching the word the racer is typing (at `typedLength`)
 * or anything before it, and always leaving at least that word.
 */
export function removeLastWords(text: string, typedLength: number, count: number = BONUS_WORDS): string {
  const removable = wordStarts(text).filter((start) => start > typedLength);
  const cut = removable.at(-Math.min(count, removable.length));
  return cut === undefined ? text : text.slice(0, cut).trimEnd();
}

/** Adds `count` words taken from `source` (e.g. the race text, so they are in the same language) at the end of `text`. */
export function appendWords(text: string, source: string, seed: number, count: number = BONUS_WORDS): string {
  const words = source.split(" ").filter((word) => word.length > 0);
  if (words.length === 0) return text;
  const extra = Array.from({ length: count }, (_, index) => words[(seed * 7 + index * 13) % words.length]);
  return `${text} ${extra.join(" ")}`;
}
