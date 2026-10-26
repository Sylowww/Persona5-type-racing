import Image from "next/image";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { formatMessage } from "@/i18n/format";
import { characterAllOutPortrait } from "@/lib/characters";
import { CONFIDANT_MAX_RANK, arcanaNumerals, characterArcana, confidantRank, hasReward } from "@/lib/confidants";
import type { CharacterId } from "@/types/character";

type ConfidantDictionary = Dictionary["confidants"];

/**
 * A thief's confidant tarot card: numeral, portrait, arcana and one pip per rank reached. The bond's rewards show on it
 * (lib/confidants.ts): halftone dots from rank 3, a gold frame from rank 6 and a sweeping foil at MAX.
 */
export function TarotCard({
  dictionary,
  character,
  rank,
  width = 150,
  className = "",
}: {
  dictionary: ConfidantDictionary;
  character: CharacterId;
  rank: number;
  /** Card width in px; the height follows. */
  width?: number;
  className?: string;
}) {
  const arcana = characterArcana[character];
  return (
    <div
      role="img"
      aria-label={formatMessage(dictionary.card, { arcana: dictionary.arcana[arcana], rank, max: CONFIDANT_MAX_RANK })}
      style={{ width }}
      className={`relative flex shrink-0 flex-col gap-2 border-2 border-secondary-fixed p-2 shadow-hard-lg shadow-primary-container ${
        hasReward(rank, "halftone") ? "halftone bg-[color-mix(in_srgb,var(--color-primary-container)_35%,var(--color-surface-container-lowest))]" : "bg-surface-container-lowest"
      } ${hasReward(rank, "gold") ? "outline-2 outline-offset-2 outline-secondary-fixed" : ""} ${className}`}
    >
      <span className="h-5 text-center font-display text-[18px] leading-5 text-secondary-fixed">{arcanaNumerals[arcana]}</span>
      <div className="relative aspect-[3/4] w-full overflow-hidden border border-secondary-fixed">
        <Image src={characterAllOutPortrait(character)} alt="" fill sizes={`${width}px`} className="object-cover" />
      </div>
      <span className="text-center font-display text-[18px] uppercase leading-none tracking-wider text-secondary-fixed">{dictionary.arcana[arcana]}</span>
      <RankPips rank={rank} />
      {hasReward(rank, "foil") && <span aria-hidden="true" className="foil-max pointer-events-none absolute inset-0" />}
    </div>
  );
}

/** The face-down side of a tarot card: a red diamond lattice with the arcana numeral in the middle. Fills its box. */
export function TarotBack({ numeral, className = "" }: { numeral: string; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center border-2 border-secondary-fixed bg-surface-container-lowest bg-[repeating-linear-gradient(45deg,var(--color-primary-container)_0_2px,transparent_2px_14px),repeating-linear-gradient(-45deg,var(--color-primary-container)_0_2px,transparent_2px_14px)] p-2 ${className}`}
    >
      <span className="flex size-16 rotate-45 items-center justify-center border-2 border-secondary-fixed bg-surface-container-lowest">
        <span className="-rotate-45 font-display text-[22px] text-secondary-fixed">{numeral}</span>
      </span>
    </div>
  );
}

/** One gold diamond per rank reached, out of the max. */
export function RankPips({ rank }: { rank: number }) {
  return (
    <span aria-hidden="true" className="flex justify-center gap-1">
      {Array.from({ length: CONFIDANT_MAX_RANK }, (_, index) => (
        <span key={index} className={`size-2 rotate-45 ${index < rank ? "bg-secondary-fixed" : "border border-secondary-fixed/50"}`} />
      ))}
    </span>
  );
}

/** "Rank 3" or "MAX", then how many races remain before the next rank. */
export function rankLines(dictionary: ConfidantDictionary, races: number): { rank: string; next: string } {
  const { rank, racesToNext } = confidantRank(races);
  return {
    rank: rank === CONFIDANT_MAX_RANK ? dictionary.max : formatMessage(dictionary.rank, { rank }),
    next: racesToNext === null ? dictionary.maxed : racesToNext === 1 ? dictionary.toNextOne : formatMessage(dictionary.toNext, { count: racesToNext }),
  };
}
