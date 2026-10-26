"use client";

import { useEffect, useRef } from "react";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { playSoundFile } from "@/lib/sound-effects";
import type { RaceCallingCard } from "@/types/race";

/** How long the calling card flips across the screen for its sender and its target. */
const CARD_FLASH_MS = 1_400;

type CardDictionary = Dictionary["race"]["callingCards"];

/** The red calling card itself, as in the countdown intro. */
function Card({ dictionary, line, className = "" }: { dictionary: CardDictionary; line: string; className?: string }) {
  return (
    <div className={`relative flex h-40 w-72 flex-col justify-between overflow-hidden bg-primary-container p-4 shadow-hard-xl shadow-surface-container-lowest ${className}`}>
      <div className="absolute -right-10 top-0 h-full w-28 -skew-x-12 bg-surface-container-lowest" />
      <span className="relative font-hud text-[12px] font-black uppercase tracking-widest text-on-primary-container">{dictionary.kicker}</span>
      <span className="relative -skew-x-6 font-display text-[30px] uppercase leading-none text-secondary">{dictionary.title}</span>
      <span className="relative self-end bg-surface-container-lowest px-2 font-hud text-[12px] font-black uppercase tracking-widest text-secondary-fixed">
        {line}
      </span>
    </div>
  );
}

/**
 * The calling card flipping in, for the racer who sent it and the leader it targets, for a moment after it was sent.
 * Decorative: the powers slot announces the card to screen readers.
 */
export function CallingCardFlash({ dictionary, cards, youId, now }: { dictionary: CardDictionary; cards: readonly RaceCallingCard[]; youId: string; now: number }) {
  const card = cards.find((candidate) => (candidate.fromId === youId || candidate.toId === youId) && now - candidate.at < CARD_FLASH_MS);
  if (!card) return null;
  return <CardFlash key={card.id} dictionary={dictionary} card={card} />;
}

function CardFlash({ dictionary, card }: { dictionary: CardDictionary; card: RaceCallingCard }) {
  // The ref keeps the sound from playing twice when development mode runs effects twice.
  const playedRef = useRef(false);
  useEffect(() => {
    if (playedRef.current) return;
    playedRef.current = true;
    playSoundFile("/sfx/calling-card.mp3", 0.7);
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[57] flex items-start justify-center pt-[14vh]">
      <Card dictionary={dictionary} line={formatMessage(dictionary.route, { from: card.from, to: card.to })} className="card-flash -rotate-6" />
    </div>
  );
}

/** Pinned over the corner of the leader's typing area while the card hides their next words. */
export function PinnedCard({ dictionary, from }: { dictionary: CardDictionary; from: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -top-8 right-4 z-20">
      <Card dictionary={dictionary} line={formatMessage(dictionary.from, { from })} className="card-pinned rotate-6 scale-75" />
    </div>
  );
}
