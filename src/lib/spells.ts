// Persona spells: the catch-up bonuses (BONUS-02), drawn Mario Kart style. Every racer draws from the same pool, so no
// character is stronger than another; the further behind the racer is, the better their odds of a big spell. The
// racer's character only decides which Persona casts it on screen.
import type { CharacterId } from "@/types/character";
import type { SpellElement, SpellId } from "@/types/race";

/**
 * `shorten`: removes words from the end of the caster's own text (helps them). `lengthen`: adds words to the leader's
 * text. `stun`: the leader's keys do nothing for a moment. `hex`: the leader's next words are hidden or hard to read.
 */
export type SpellEffect =
  | { type: "shorten"; words: number }
  | { type: "lengthen"; words: number }
  | { type: "stun"; ms: number }
  | { type: "hex"; ms: number };

/** `small` spells cost or save about 1.5 to 2 s, `big` ones about 3 s (for a racer near 50 WPM). */
export type SpellTier = "small" | "big";

export type Spell = { id: SpellId; element: SpellElement; tier: SpellTier; effect: SpellEffect };

const spell = (id: SpellId, element: SpellElement, tier: SpellTier, effect: SpellEffect): Spell => ({ id, element, tier, effect });

/** The pool every racer draws from. Skill names come from Persona 5 (Royal and Strikers). */
export const spellPool: readonly Spell[] = [
  spell("zio", "elec", "small", { type: "stun", ms: 1_500 }),
  spell("psi", "psy", "small", { type: "hex", ms: 4_000 }),
  spell("eiga", "curse", "small", { type: "hex", ms: 4_000 }),
  spell("swordDance", "phys", "small", { type: "lengthen", words: 2 }),
  spell("navi", "support", "small", { type: "shorten", words: 2 }),
  spell("mediarama", "heal", "small", { type: "shorten", words: 2 }),
  spell("bufu", "ice", "big", { type: "stun", ms: 2_500 }),
  spell("agi", "fire", "big", { type: "hex", ms: 4_000 }),
  // A full blinding flash: shorter than the other hexes, since it hides even the word being typed.
  spell("kouga", "bless", "big", { type: "hex", ms: 2_500 }),
  spell("frei", "nuclear", "big", { type: "lengthen", words: 3 }),
  spell("garu", "wind", "big", { type: "shorten", words: 3 }),
];

/** Each character's Persona, shown when they cast a spell. */
export const characterPersonas: Record<CharacterId, string> = {
  joker: "Arsène",
  mona: "Zorro",
  skull: "Captain Kidd",
  panther: "Carmen",
  fox: "Goemon",
  queen: "Johanna",
  oracle: "Necronomicon",
  noir: "Milady",
  crow: "Robin Hood",
  violet: "Cendrillon",
  blackMask: "Loki",
  sophia: "Pandora",
};

/** Chance of a big spell: 20% right behind the leader, rising with the gap up to 85% half a text behind or more. */
export function bigSpellChance(gap: number): number {
  return Math.min(0.85, Math.max(0.2, 0.2 + (gap / 0.5) * 0.65));
}

/**
 * Draws a spell for a racer `gap` behind the leader (in share of the text, 0 to 1): first the tier, from the gap,
 * then one spell of that tier at random.
 */
export function drawSpell(gap: number, random: () => number): Spell {
  const tier: SpellTier = random() < bigSpellChance(gap) ? "big" : "small";
  const choices = spellPool.filter((candidate) => candidate.tier === tier);
  return choices[Math.floor(random() * choices.length)];
}

/** Whether a spell acts on the caster (support) rather than on the leader. */
export function isSelfSpell(cast: Spell): boolean {
  return cast.effect.type === "shorten";
}

export function spellById(id: SpellId): Spell | undefined {
  return spellPool.find((candidate) => candidate.id === id);
}
