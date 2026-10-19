// Persona spells: the catch-up bonus a lagging racer casts is their character's signature skill (BONUS-02).
// Each spell is one of a few effects, so the race engine only knows "shorten", "lengthen", "stun" and "hex".
import type { CharacterId } from "@/types/character";
import type { SpellElement, SpellId } from "@/types/race";

/**
 * `shorten`: removes words from the end of the caster's own text (helps them). `lengthen`: adds words to the leader's
 * text. `stun`: the leader's keys do nothing for a moment. `hex`: the leader's next words are hard to read for a while.
 */
export type SpellEffect =
  | { type: "shorten"; words: number }
  | { type: "lengthen"; words: number }
  | { type: "stun"; ms: number }
  | { type: "hex"; ms: number };

export type Spell = { id: SpellId; persona: string; element: SpellElement; effect: SpellEffect };

const spell = (id: SpellId, persona: string, element: SpellElement, effect: SpellEffect): Spell => ({ id, persona, element, effect });

/**
 * Each character's spell, true to their Persona's specialty: Mona's wind (Zorro), Skull's lightning (Captain Kidd),
 * Panther's fire (Carmen), Fox's ice (Goemon), Queen's nuclear blasts (Johanna), Oracle's navigation (Necronomicon),
 * Noir's psychokinesis (Milady), Crow's blessing light (Robin Hood), Violet's sword dance (Cendrillon), Black Mask's
 * curse (Loki) and Sophia's healing (Pandora). Joker has no spell of his own: his Wild Card casts one of theirs.
 */
export const characterSpells: Record<Exclude<CharacterId, "joker">, Spell> = {
  mona: spell("garu", "Zorro", "wind", { type: "shorten", words: 3 }),
  skull: spell("zio", "Captain Kidd", "elec", { type: "stun", ms: 1_000 }),
  panther: spell("agi", "Carmen", "fire", { type: "hex", ms: 4_000 }),
  fox: spell("bufu", "Goemon", "ice", { type: "stun", ms: 1_500 }),
  queen: spell("frei", "Johanna", "nuclear", { type: "lengthen", words: 3 }),
  oracle: spell("navi", "Necronomicon", "support", { type: "shorten", words: 2 }),
  noir: spell("psi", "Milady", "psy", { type: "hex", ms: 5_000 }),
  crow: spell("kouga", "Robin Hood", "bless", { type: "hex", ms: 4_000 }),
  violet: spell("swordDance", "Cendrillon", "phys", { type: "lengthen", words: 2 }),
  blackMask: spell("eiga", "Loki", "curse", { type: "hex", ms: 4_000 }),
  sophia: spell("mediarama", "Pandora", "heal", { type: "shorten", words: 2 }),
};

const castable = Object.values(characterSpells);

/** Joker's Persona, shown when his Wild Card picks another character's spell. */
export const WILD_CARD_PERSONA = "Arsène";

/** The spell `character` casts, and whether it came from Joker's Wild Card (then picked by `random`). */
export function spellFor(character: CharacterId, random: () => number): { spell: Spell; wildCard: boolean } {
  if (character !== "joker") return { spell: characterSpells[character], wildCard: false };
  return { spell: castable[Math.floor(random() * castable.length)], wildCard: true };
}

/** Whether a spell acts on the caster (support) rather than on the leader. */
export function isSelfSpell(cast: Spell): boolean {
  return cast.effect.type === "shorten";
}
