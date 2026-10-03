"use client";

import Image from "next/image";
import { CutInBand, useCutInClock } from "@/components/ui/cut-in";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { RESULTS_CUT_IN_TIMELINE, revealedLength } from "@/lib/cut-in";

/** Mona's portraits in `public/portraits/` (440 px tall): proud when the player escaped, worried otherwise. */
const portraits = {
  escaped: { src: "/portraits/mona-proud.webp", width: 345, height: 440 },
  training: { src: "/portraits/mona-worried.webp", width: 451, height: 440 },
} as const;

type ResultsCutInProps = {
  dictionary: Dictionary["results"]["cutIn"];
  /** True when the player finished the text before the race ended (escaped the Palace). */
  escaped: boolean;
};

/** Once the collapse wedges open, Mona congratulates the player for escaping, or tells them to train. */
export function ResultsCutIn({ dictionary, escaped }: ResultsCutInProps) {
  const line = escaped ? dictionary.escaped : dictionary.training;
  const portrait = portraits[escaped ? "escaped" : "training"];
  const elapsed = useCutInClock(true, line, RESULTS_CUT_IN_TIMELINE, RESULTS_CUT_IN_TIMELINE.delay);

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
