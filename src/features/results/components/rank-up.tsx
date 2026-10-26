import { RansomText } from "@/components/ui/ransom-text";
import { TarotCard, rankLines } from "@/features/characters/components/tarot-card";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { formatMessage } from "@/i18n/format";
import { characterArcana } from "@/lib/confidants";
import type { CharacterId } from "@/types/character";

type RankUpProps = {
  dictionary: Dictionary["confidants"];
  character: CharacterId;
  /** The thief's display name. */
  name: string;
  /** The rank this race reached. */
  rank: number;
  /** Saved races with this thief, this one included. */
  races: number;
};

/**
 * "RANK UP!" on the results when the race raised the player's confidant bond: the tarot card flips in once Mona's
 * verdict is over (`.rank-up-*` in globals.css), then stays on the page.
 */
export function RankUp({ dictionary, character, name, rank, races }: RankUpProps) {
  const lines = rankLines(dictionary, races);
  return (
    <section aria-labelledby="rank-up-title" className="rank-up flex flex-wrap items-center justify-center gap-8 py-2">
      <TarotCard dictionary={dictionary} character={character} rank={rank} className="rank-up-card -rotate-3" />
      <div className="flex flex-col items-start gap-2">
        <span className="eyebrow">{formatMessage(dictionary.arcanaLabel, { arcana: dictionary.arcana[characterArcana[character]] })}</span>
        <h2 id="rank-up-title">
          <span className="sr-only">{dictionary.rankUp}</span>
          <RansomText text={dictionary.rankUp} className="text-[56px] leading-none" />
        </h2>
        <p className="-skew-x-12 bg-secondary-fixed px-3 font-display text-headline-sm uppercase text-on-secondary-fixed">{lines.rank}</p>
        <p className="text-body-md text-on-surface">{formatMessage(dictionary.bond, { name })}</p>
        <p className="font-hud text-label-hud font-black uppercase tracking-widest text-on-surface-variant">{lines.next}</p>
      </div>
    </section>
  );
}
