import type { IconName } from "@/components/ui/icon";
import type { RaceBonusEvent, SpellElement } from "@/types/race";

/** Color and icon of each spell element (tokens in globals.css). */
export const spellStyle: Record<SpellElement, { text: string; bg: string; border: string; icon: IconName }> = {
  fire: { text: "text-spell-fire", bg: "bg-spell-fire", border: "border-spell-fire", icon: "local_fire_department" },
  ice: { text: "text-spell-ice", bg: "bg-spell-ice", border: "border-spell-ice", icon: "ac_unit" },
  elec: { text: "text-spell-elec", bg: "bg-spell-elec", border: "border-spell-elec", icon: "bolt" },
  wind: { text: "text-spell-wind", bg: "bg-spell-wind", border: "border-spell-wind", icon: "air" },
  nuclear: { text: "text-spell-nuclear", bg: "bg-spell-nuclear", border: "border-spell-nuclear", icon: "flare" },
  psy: { text: "text-spell-psy", bg: "bg-spell-psy", border: "border-spell-psy", icon: "psychology" },
  bless: { text: "text-spell-bless", bg: "bg-spell-bless", border: "border-spell-bless", icon: "light_mode" },
  curse: { text: "text-spell-curse", bg: "bg-spell-curse", border: "border-spell-curse", icon: "dark_mode" },
  phys: { text: "text-spell-phys", bg: "bg-spell-phys", border: "border-spell-phys", icon: "swords" },
  heal: { text: "text-spell-heal", bg: "bg-spell-heal", border: "border-spell-heal", icon: "healing" },
  support: { text: "text-spell-support", bg: "bg-spell-support", border: "border-spell-support", icon: "radar" },
};

/**
 * Spell events this page knows how to show. A server still running an older race engine (e.g. during a deploy, or a
 * dev server not restarted) can send events in another shape; they are skipped instead of breaking the race.
 */
export function knownSpellEvents(events: readonly RaceBonusEvent[], names: Readonly<Record<string, string>>): RaceBonusEvent[] {
  return events.filter((event) => Object.hasOwn(spellStyle, event.element) && Object.hasOwn(names, event.spell));
}
