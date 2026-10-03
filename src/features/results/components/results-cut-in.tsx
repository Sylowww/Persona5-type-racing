"use client";

import Image from "next/image";
import { CutInBand, useCutInClock } from "@/components/ui/cut-in";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { RESULTS_CUT_IN_TIMELINE, revealedLength, type ResultsVerdict } from "@/lib/cut-in";

/** Mona's portrait (`public/portraits/`, 440 px tall) and recorded line (`public/voices/`) for each verdict. */
const portraits: Record<ResultsVerdict, { src: string; width: number; height: number; voice: string }> = {
  escaped: { src: "/portraits/mona-proud.webp", width: 345, height: 440, voice: "/voices/mona/amazing.mp3" },
  last: { src: "/portraits/mona-shocked.webp", width: 402, height: 440, voice: "/voices/mona/not-bad.mp3" },
  training: { src: "/portraits/mona-worried.webp", width: 451, height: 440, voice: "/voices/mona/go-to-bed.mp3" },
};

type ResultsCutInProps = {
  dictionary: Dictionary["results"]["cutIn"];
  verdict: ResultsVerdict;
};

/** Once the collapse wedges open, Mona congratulates the player, scolds them for finishing last, or tells them to train. */
export function ResultsCutIn({ dictionary, verdict }: ResultsCutInProps) {
  const line = dictionary[verdict];
  const portrait = portraits[verdict];
  const elapsed = useCutInClock(true, line, RESULTS_CUT_IN_TIMELINE, {
    delayMs: RESULTS_CUT_IN_TIMELINE.delay,
    voice: portrait.voice,
  });

  const image = (className: string) => (
    // Eager: the band starts off-screen, where a lazy image would wait (and keep a zero width).
    <Image
      src={portrait.src}
      alt={dictionary.portraitAlt}
      width={portrait.width}
      height={portrait.height}
      loading="eager"
      className={className}
    />
  );

  // While the wedges open, the portrait loads hidden so it is ready when the band arrives.
  if (elapsed === null) return image("hidden");
  if (elapsed >= RESULTS_CUT_IN_TIMELINE.endsAt) return null;

  return (
    <CutInBand
      className="bottom-[14vh]"
      speaker={dictionary.speaker}
      line={line}
      shownLength={revealedLength(elapsed, line.length, RESULTS_CUT_IN_TIMELINE)}
      leaving={elapsed >= RESULTS_CUT_IN_TIMELINE.leavesAt}
      visual={
        // The bust rises above the band, like the game's dialogue portraits.
        image("-mt-12 h-[180px] w-auto drop-shadow-[4px_4px_0_var(--color-surface-container-lowest)] md:-mt-16 md:h-[250px]")
      }
    />
  );
}
