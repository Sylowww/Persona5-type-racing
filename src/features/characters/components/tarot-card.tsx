import Image from "next/image";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { formatMessage } from "@/i18n/format";
import { characterAllOutPortrait } from "@/lib/characters";
import { CONFIDANT_MAX_RANK, arcanaNumerals, characterArcana, confidantRank } from "@/lib/confidants";
import type { CharacterId } from "@/types/character";

type ConfidantDictionary = Dictionary["confidants"];

/** A thief's confidant tarot card: numeral, portrait, arcana and one pip per rank reached. */
export function TarotCard({ dictionary, character, rank, className = "" }: { dictionary: ConfidantDictionary; character: CharacterId; rank: number; className?: string }) {
  const arcana = characterArcana[character];
  return (
    <div
      role="img"
      aria-label={formatMessage(dictionary.card, { arcana: dictionary.arcana[arcana], rank, max: CONFIDANT_MAX_RANK })}
      className={`flex w-[150px] shrink-0 flex-col gap-2 border-2 border-secondary-fixed bg-surface-container-lowest p-2 shadow-hard-lg shadow-primary-container ${className}`}
    >
      <span className="h-5 text-center font-display text-[18px] leading-5 text-secondary-fixed">{arcanaNumerals[arcana]}</span>
      <div className="relative aspect-[3/4] w-full overflow-hidden border border-secondary-fixed">
        <Image src={characterAllOutPortrait(character)} alt="" fill sizes="150px" className="object-cover" />
      </div>
      <span className="text-center font-display text-[18px] uppercase leading-none tracking-wider text-secondary-fixed">{dictionary.arcana[arcana]}</span>
      <RankPips rank={rank} />
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
