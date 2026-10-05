"use client";

import Image from "next/image";
import { CutInBand, useCutInClock } from "@/components/ui/cut-in";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { characterAllOutPortrait } from "@/lib/characters";
import { WINNER_CUT_IN_TIMELINE, revealedLength } from "@/lib/cut-in";
import type { CharacterId } from "@/types/character";

type WinnerCutInProps = {
  dictionary: Dictionary["race"]["winner"];
  name: string;
  character: CharacterId;
};

/** Shown to the other racers when the first one reaches the exit: their character's all-out attack portrait in a "Showtime" style band. */
export function WinnerCutIn({ dictionary, name, character }: WinnerCutInProps) {
  const line = formatMessage(dictionary.line, { name });
  const elapsed = useCutInClock(true, line, WINNER_CUT_IN_TIMELINE, { voice: "/sfx/winner.mp3" });

  if (elapsed === null || elapsed >= WINNER_CUT_IN_TIMELINE.endsAt) return null;

  return (
    <CutInBand
      className="top-[16vh]"
      speaker={dictionary.tag}
      line={line}
      shownLength={revealedLength(elapsed, line.length, WINNER_CUT_IN_TIMELINE)}
      leaving={elapsed >= WINNER_CUT_IN_TIMELINE.leavesAt}
      visual={
        <div className="relative size-[130px] -rotate-6 bg-secondary p-1.5 shadow-hard-lg shadow-primary-container md:size-[210px]">
          <div className="relative size-full overflow-hidden [clip-path:polygon(6%_0,100%_0,94%_100%,0_100%)]">
            <Image src={characterAllOutPortrait(character)} alt="" fill sizes="210px" className="object-cover" priority />
          </div>
        </div>
      }
    />
  );
}
