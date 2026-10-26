"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { RansomText } from "@/components/ui/ransom-text";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { characterAllOutPortrait } from "@/lib/characters";
import { playCutInSwoosh } from "@/lib/sound-effects";
import type { CharacterId } from "@/types/character";

type HoldUpCutInProps = {
  dictionary: Dictionary["race"]["holdUp"];
  /** The racer just passed. */
  name: string;
  character: CharacterId;
};

/**
 * "HOLD UP!" when the local player passes a racer: a quick tilted band high on the screen, with the passed racer's
 * portrait cornered. Short and away from the typing area so it never hides the text. Decorative and aria-hidden.
 */
export function HoldUpCutIn({ dictionary, name, character }: HoldUpCutInProps) {
  // The ref keeps the sound from playing twice when development mode runs effects twice.
  const playedRef = useRef(false);
  useEffect(() => {
    if (playedRef.current) return;
    playedRef.current = true;
    playCutInSwoosh();
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-[10vh] z-[56] overflow-hidden py-6">
      <div className="hold-up relative -rotate-3">
        <div className="absolute inset-x-[-5%] inset-y-3 bg-surface-container-lowest" />
        <div className="absolute inset-x-[-5%] top-3 h-1.5 bg-primary-container" />
        <div className="absolute inset-x-[-5%] bottom-3 h-1.5 bg-primary-container" />
        <div className="relative mx-auto flex max-w-[1100px] items-center justify-center gap-6 px-6">
          <div className="relative size-[96px] shrink-0 rotate-6 bg-secondary p-1 shadow-hard-md shadow-primary-container">
            <div className="relative size-full overflow-hidden grayscale [clip-path:polygon(6%_0,100%_0,94%_100%,0_100%)]">
              <Image src={characterAllOutPortrait(character)} alt="" fill sizes="96px" className="object-cover" />
            </div>
          </div>
          <div className="flex flex-col items-start gap-1">
            <RansomText text={dictionary.title} className="text-[64px] leading-none" />
            <span className="-skew-x-12 bg-secondary px-3 font-hud text-[14px] font-black uppercase tracking-widest text-surface-container-lowest">
              {formatMessage(dictionary.line, { name })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
