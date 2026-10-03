"use client";

import { useEffect, useRef } from "react";
import { SpriteFrames } from "@/components/ui/sprite-frames";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { CharacterSprite } from "@/lib/characters";
import { playSoundFile } from "@/lib/sound-effects";

type FinishCutInProps = {
  dictionary: Dictionary["race"]["finish"];
  character: CharacterSprite;
};

/**
 * "All-Out Attack" style freeze frame when the local player reaches the exit: a red slash across a black
 * screen with their character's silhouette. Shown briefly by the race page; decorative and aria-hidden.
 */
export function FinishCutIn({ dictionary, character }: FinishCutInProps) {
  // The ref keeps the sound from playing twice when development mode runs effects twice.
  const playedRef = useRef(false);
  useEffect(() => {
    if (playedRef.current) return;
    playedRef.current = true;
    playSoundFile("/sfx/all-out-attack.mp3", 0.8);
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[58] overflow-hidden">
      <div className="cutin-band absolute inset-0 bg-surface-container-lowest/90" />
      <div className="finish-slash absolute inset-x-[-10%] top-[22%] h-[56%] -rotate-6 bg-primary-container" />
      <div className="finish-slash absolute inset-x-[-10%] top-[22%] h-3 -rotate-6 bg-secondary" />
      <div className="relative flex h-full items-center justify-center gap-6 px-4">
        <div className="finish-pop [filter:brightness(0)_drop-shadow(6px_6px_0_var(--color-secondary))] max-md:scale-75">
          <SpriteFrames character={character} animation="victory" size={300} />
        </div>
        <div className="finish-pop flex flex-col items-start gap-2">
          <span className="-skew-x-12 bg-surface-container-lowest px-5 font-display text-[64px] uppercase leading-tight text-secondary-fixed shadow-hard-xl md:text-[112px]">
            {dictionary.title}
          </span>
          <span className="-skew-x-12 bg-secondary px-3 py-1 font-hud text-[14px] font-black uppercase tracking-widest text-surface-container-lowest">
            {dictionary.subtitle}
          </span>
        </div>
      </div>
    </div>
  );
}
