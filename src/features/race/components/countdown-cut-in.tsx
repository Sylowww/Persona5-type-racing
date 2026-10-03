"use client";

import { useEffect, useRef, useState } from "react";
import { CutInBand, useCutInClock } from "@/components/ui/cut-in";
import { SpriteFrames } from "@/components/ui/sprite-frames";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { characterSprite } from "@/lib/characters";
import { CALLING_CARD_MS, CUT_IN_TIMELINE, countdownIntro, revealedLength } from "@/lib/cut-in";
import { playSoundFile } from "@/lib/sound-effects";

const mona = characterSprite("mona");
/** Mona's recorded line, matching `race.cutIn.line`. */
const VOICE = "/voices/mona/lets-go.mp3";

type CountdownCutInProps = {
  dictionary: Dictionary["race"]["cutIn"];
  callingCard: Dictionary["race"]["callingCard"];
  /** Server-aligned race clock and start, to fit the intro into the countdown time left. */
  now: number;
  startsAt: number;
};

/**
 * Countdown intro: a calling card flips in, then Mona shouts to run and dashes off before the start.
 * Both are skipped when the countdown has too little time left. It never covers the countdown number.
 */
export function CountdownCutIn({ dictionary, callingCard, now, startsAt }: CountdownCutInProps) {
  // Decided once, from the first render, so the same markup renders on the server and the client.
  const [intro] = useState(() => countdownIntro(startsAt - now));
  const line = dictionary.line;
  const elapsed = useCutInClock(intro.mona, line, CUT_IN_TIMELINE, {
    delayMs: intro.card ? CALLING_CARD_MS : 0,
    voice: VOICE,
  });

  // The ref keeps the sound from playing twice when development mode runs effects twice.
  const cardPlayedRef = useRef(false);
  useEffect(() => {
    if (!intro.card || cardPlayedRef.current) return;
    cardPlayedRef.current = true;
    playSoundFile("/sfx/calling-card.mp3", 0.7);
  }, [intro.card]);

  if (intro.card && elapsed === null) {
    return (
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[65] flex items-start justify-center pt-[18vh]">
        <div className="calling-card relative flex h-44 w-72 -rotate-6 flex-col justify-between overflow-hidden bg-primary-container p-4 shadow-hard-xl shadow-surface-container-lowest">
          <div className="absolute -right-10 top-0 h-full w-28 -skew-x-12 bg-surface-container-lowest" />
          <span className="relative font-hud text-[12px] font-black uppercase tracking-widest text-on-primary-container">
            {callingCard.kicker}
          </span>
          <span className="relative -skew-x-6 font-display text-[34px] uppercase leading-none text-secondary">
            {callingCard.title}
          </span>
          <span className="relative self-end font-display text-[18px] tracking-wider text-secondary-fixed">TYPE//STRIKE</span>
        </div>
      </div>
    );
  }
  if (elapsed === null || elapsed >= CUT_IN_TIMELINE.endsAt) return null;
  const runsOff = elapsed >= CUT_IN_TIMELINE.runsOffAt;

  return (
    <CutInBand
      className="top-[16vh]"
      speaker={dictionary.speaker}
      line={line}
      shownLength={revealedLength(elapsed, line.length)}
      leaving={elapsed >= CUT_IN_TIMELINE.leavesAt}
      visual={
        <div
          className={`max-md:-mx-6 max-md:scale-[0.7] transition-[translate] duration-500 ease-in motion-reduce:transition-none ${
            runsOff ? "translate-x-[110vw]" : ""
          }`}
        >
          <SpriteFrames character={mona} animation={runsOff ? "run" : "victory"} size={176} />
        </div>
      }
    />
  );
}
