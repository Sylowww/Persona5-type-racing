import { RansomText } from "@/components/ui/ransom-text";
import { Tilt } from "@/components/ui/tilt";
import { TarotBack, TarotCard, rankLines } from "@/features/characters/components/tarot-card";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { formatMessage } from "@/i18n/format";
import { arcanaNumerals, characterArcana } from "@/lib/confidants";
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
 * "RANK UP!" on the results when the race raised the player's confidant bond: the tarot card arrives face down once
 * Mona's verdict is over and turns over (`.rank-up-*` in globals.css), then stays on the page with a foil glare that
 * follows the mouse.
 */
export function RankUp({ dictionary, character, name, rank, races }: RankUpProps) {
  const lines = rankLines(dictionary, races);
  return (
    <section aria-labelledby="rank-up-title" className="rank-up flex flex-wrap items-center justify-center gap-8 py-2">
      <Tilt glare="holo" max={14} className="-rotate-3">
        <div className="rank-up-card flip-card relative">
          <TarotCard dictionary={dictionary} character={character} rank={rank} className="flip-face" />
          <TarotBack numeral={arcanaNumerals[characterArcana[character]]} className="flip-face flip-back absolute inset-0" />
        </div>
      </Tilt>
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
