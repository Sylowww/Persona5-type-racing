"use client";

import { CutInBand, useCutInClock } from "@/components/ui/cut-in";
import { SpriteFrames } from "@/components/ui/sprite-frames";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { characterSprite } from "@/lib/characters";
import { WINNER_CUT_IN_TIMELINE, revealedLength } from "@/lib/cut-in";
import type { CharacterId } from "@/types/character";

type WinnerCutInProps = {
  dictionary: Dictionary["race"]["winner"];
  name: string;
  character: CharacterId;
};

/** Shown to the other racers when the first one reaches the exit: their character in a "Showtime" style band. */
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
        <div className="max-md:-mx-6 max-md:scale-[0.7]">
          <SpriteFrames character={characterSprite(character)} animation="victory" size={176} />
        </div>
      }
    />
  );
}
