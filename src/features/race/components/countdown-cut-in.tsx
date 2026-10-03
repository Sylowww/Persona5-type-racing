"use client";

import { useState } from "react";
import { CutInBand, useCutInClock } from "@/components/ui/cut-in";
import { SpriteFrames } from "@/components/ui/sprite-frames";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { characterSprite } from "@/lib/characters";
import { CUT_IN_TIMELINE, cutInLineIndex, revealedLength, shouldPlayCutIn } from "@/lib/cut-in";

const mona = characterSprite("mona");

type CountdownCutInProps = {
  dictionary: Dictionary["race"]["cutIn"];
  /** Server-aligned race clock and start, to skip the cut-in when the countdown is almost over. */
  now: number;
  startsAt: number;
};

/** During the countdown, Mona shouts to run, then dashes off before the start. It never covers the countdown number. */
export function CountdownCutIn({ dictionary, now, startsAt }: CountdownCutInProps) {
  // Decided once, from the first render, so the same markup renders on the server and the client.
  const [play] = useState(() => shouldPlayCutIn(startsAt - now));
  const line = dictionary.lines[cutInLineIndex(startsAt, dictionary.lines.length)] ?? "";
  const elapsed = useCutInClock(play, line, CUT_IN_TIMELINE);

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
