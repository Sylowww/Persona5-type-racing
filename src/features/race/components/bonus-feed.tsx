import { Icon, type IconName } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { BonusKind, RaceBonusEvent } from "@/types/race";

type BonusFeedProps = {
  dictionary: Dictionary["race"]["bonuses"];
  events: readonly RaceBonusEvent[];
  youId: string;
};

const icons: Record<BonusKind, IconName> = { shortcut: "bolt", burden: "add_circle", fog: "visibility" };

/**
 * Announces catch-up bonuses on the track (BONUS-03): one line per bonus for everyone, and a louder line for the
 * player it acts on.
 */
export function BonusFeed({ dictionary, events, youId }: BonusFeedProps) {
  if (events.length === 0) return null;
  const forYou = events.filter((event) => event.targetId === youId);

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-2">
      {forYou.map((event) => (
        <p
          key={`you-${event.id}`}
          className="flex -rotate-1 items-center gap-2 bg-secondary-fixed px-4 py-2 font-hud text-headline-sm font-black uppercase italic text-on-secondary-fixed shadow-hard-md shadow-primary-container motion-safe:animate-pulse"
        >
          <Icon name={icons[event.kind]} size={24} />
          {dictionary.onYou[event.kind]}
        </p>
      ))}
      <ul className="flex flex-wrap gap-2">
        {events.map((event) => (
          <li key={event.id} className="flex items-center gap-1.5 bg-primary-container px-3 py-1 font-hud text-label-hud font-black uppercase text-on-primary-container shadow-hard-xs">
            <Icon name={icons[event.kind]} size={16} />
            {formatMessage(dictionary.announce[event.kind], { receiver: event.receiver, target: event.target })}
          </li>
        ))}
      </ul>
    </div>
  );
}
