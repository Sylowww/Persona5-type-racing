import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { RaceBonusEvent } from "@/types/race";
import { knownSpellEvents, spellStyle } from "../spell-style";

type BonusFeedProps = {
  dictionary: Dictionary["race"]["spells"];
  events: readonly RaceBonusEvent[];
  youId: string;
};

/**
 * Announces catch-up spells on the track (BONUS-03): one line per spell for everyone, in its element's color, and a
 * louder line for the player it acts on.
 */
export function BonusFeed({ dictionary, events: received, youId }: BonusFeedProps) {
  const events = knownSpellEvents(received, dictionary.names);
  if (events.length === 0) return null;
  const forYou = events.filter((event) => event.targetId === youId);

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      {forYou.map((event) => {
        const style = spellStyle[event.element];
        return (
          <p
            key={`you-${event.id}`}
            className={`spell-burst flex -rotate-1 items-center gap-2 border-l-8 bg-surface-container-lowest px-4 py-2 font-hud text-headline-sm font-black uppercase italic shadow-hard-md ${style.border} ${style.text}`}
          >
            <Icon name={style.icon} size={26} filled />
            {formatMessage(dictionary.onYou[event.spell], { name: dictionary.names[event.spell] })}
          </p>
        );
      })}
      <ul className="flex flex-wrap gap-2">
        {events.map((event) => {
          const style = spellStyle[event.element];
          return (
            <li key={event.id} className="flex items-center gap-1.5 bg-surface-container-highest px-3 py-1 font-hud text-label-hud font-black uppercase text-secondary shadow-hard-xs">
              <Icon name={style.icon} size={16} filled className={style.text} />
              {formatMessage(dictionary.announce[event.spell], {
                caster: event.receiver,
                target: event.target,
                persona: event.persona,
                name: dictionary.names[event.spell],
              })}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
