// Catch-up bonuses (BONUS-01 to BONUS-04): pure rules, applied by the race engine. Kept apart from the engine so
// their exact behavior can change without touching the race model.

/** Leader progress at which bonuses are handed out. */
export const BONUS_CHECKPOINTS: readonly number[] = [0.25, 0.5, 0.75];
/** A racer this far behind the leader (in share of the text) is lagging, as is the last racer. */
export const LAGGING_GAP = 0.25;
export const MAX_BONUSES_PER_RACER = 3;
/** Spells handed out at one checkpoint, to the racers furthest behind, so a full class does not bury the leader. */
export const MAX_SPELLS_PER_CHECKPOINT = 3;
export const BONUS_WORDS = 3;
/** How long a bot hesitates under a hex, since it cannot be blinded. */
export const BOT_HEX_DELAY_MS = 1_500;

/** Number of checkpoints passed by a leader at `leaderProgress`. */
export function checkpointsReached(leaderProgress: number): number {
  return BONUS_CHECKPOINTS.filter((checkpoint) => leaderProgress >= checkpoint).length;
}

type Contender = { id: string; progress: number; bonuses: number };

/**
 * Who gets a bonus at a checkpoint, among racers still typing: the last one and anyone more than `LAGGING_GAP`
 * behind the leader, never the leader, and at most `MAX_BONUSES_PER_RACER` per race. Of those, only the
 * `MAX_SPELLS_PER_CHECKPOINT` furthest behind get one. Returns the leader too, the target of the spells that slow down
 * the front of the race. Ties go to the racer listed first.
 */
export function pickBonusReceivers(contenders: readonly Contender[]): { leaderId: string | null; receiverIds: string[] } {
  if (contenders.length < 2) return { leaderId: null, receiverIds: [] };
  const leader = contenders.reduce((best, racer) => (racer.progress > best.progress ? racer : best));
  const last = contenders.reduce((worst, racer) => (racer.progress < worst.progress ? racer : worst));
  const receiverIds = contenders
    .filter((racer) => racer !== leader && racer.bonuses < MAX_BONUSES_PER_RACER)
    .filter((racer) => racer === last || leader.progress - racer.progress > LAGGING_GAP)
    .sort((a, b) => a.progress - b.progress)
    .slice(0, MAX_SPELLS_PER_CHECKPOINT)
    .map((racer) => racer.id);
  return { leaderId: leader.id, receiverIds };
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

/** Words off the text of the first racer to type the first word without a mistake ("Ambush!"). */
export const AMBUSH_WORDS = 1;

/** Characters to type to finish the first word of `text`, its space included. */
export function firstWordLength(text: string): number {
  const space = text.indexOf(" ");
  return space === -1 ? text.length : space + 1;
}

/** How long a calling card hides the leader's next words. */
export const CALLING_CARD_HEX_MS = 3_000;
/** Before the leader is this far, everyone is still bunched up at the start: no calling card yet. */
export const CALLING_CARD_MIN_LEADER_PROGRESS = 0.1;

/**
 * Whether `senderId` may send their calling card to the leader: they are last among the racers still typing, someone
 * else leads, and the leader got far enough for the gap to mean something. Ties go to the racer listed first, as for
 * the spells. Returns the leader to target.
 */
export function callingCardTarget(contenders: readonly Omit<Contender, "bonuses">[], senderId: string): string | null {
  if (contenders.length < 2) return null;
  const leader = contenders.reduce((best, racer) => (racer.progress > best.progress ? racer : best));
  const last = contenders.reduce((worst, racer) => (racer.progress < worst.progress ? racer : worst));
  if (last.id !== senderId || leader === last || leader.progress < CALLING_CARD_MIN_LEADER_PROGRESS) return null;
  return leader.id;
}
