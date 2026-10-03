"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { detectMoments, pickComment, recentMistakes, type MomentSnapshot, type RaceMoment } from "@/lib/race-moments";
import { playVoiceLine } from "@/lib/sound-effects";

/** How long a comment stays on screen. */
const SHOWN_MS = 2600;

/** Mona's recorded line (in `public/voices/mona/`) and portrait for each moment. */
const comments: Record<RaceMoment, { voice: string; portrait: "proud" | "worried" | "shocked" }> = {
  finished: { voice: "well-done.mp3", portrait: "proud" },
  chaos: { voice: "dont-panic.mp3", portrait: "worried" },
  finalStretch: { voice: "one-more.mp3", portrait: "proud" },
  overtaken: { voice: "wake-up.mp3", portrait: "shocked" },
  overtook: { voice: "keep-it-up.mp3", portrait: "proud" },
  fumble: { voice: "not-good.mp3", portrait: "worried" },
  streak: { voice: "nice-going.mp3", portrait: "proud" },
};

const portraits = {
  proud: { src: "/portraits/mona-proud.webp", width: 345 },
  worried: { src: "/portraits/mona-worried.webp", width: 451 },
  shocked: { src: "/portraits/mona-shocked.webp", width: 402 },
} as const;

type MonaCommsProps = {
  dictionary: Dictionary["race"]["comms"];
  /** Race clock; comments only happen while `active` (racing, not the countdown or the final collapse). */
  now: number;
  active: boolean;
  place: number;
  streak: number;
  progress: number;
  mistakes: number;
  finished: boolean;
  chaos: boolean;
};

type Comment = { moment: RaceMoment; at: number };

/**
 * Mona as navigator: a small corner box where she reacts to the local player's race (places won or lost,
 * streaks, fumbles, the final stretch, the chaos, the finish) with one of her recorded lines.
 */
export function MonaComms({ dictionary, now, active, place, streak, progress, mistakes, finished, chaos }: MonaCommsProps) {
  const [tracked, setTracked] = useState({ place, streak, progress, mistakes, finished, chaos, mistakeTimes: [] as number[] });
  const [comment, setComment] = useState<Comment | null>(null);

  // Compared while rendering (like the race runner) so a new moment shows in the same render.
  const changed =
    place !== tracked.place ||
    streak !== tracked.streak ||
    progress !== tracked.progress ||
    mistakes !== tracked.mistakes ||
    finished !== tracked.finished ||
    chaos !== tracked.chaos;
  if (changed) {
    const mistakeTimes = recentMistakes(tracked.mistakeTimes, now, mistakes > tracked.mistakes);
    const previous: MomentSnapshot = { ...tracked, recentMistakes: tracked.mistakeTimes.length };
    const next: MomentSnapshot = { place, streak, progress, finished, chaos, recentMistakes: mistakeTimes.length };
    setTracked({ place, streak, progress, mistakes, finished, chaos, mistakeTimes });
    const moment = active ? pickComment(detectMoments(previous, next), comment?.at ?? null, now) : null;
    if (moment) setComment({ moment, at: now });
  }

  useEffect(() => {
    if (comment) playVoiceLine(`/voices/mona/${comments[comment.moment].voice}`);
  }, [comment]);

  if (!comment || now - comment.at >= SHOWN_MS) return null;
  const portrait = portraits[comments[comment.moment].portrait];

  return (
    <div
      key={comment.at}
      aria-hidden="true"
      className="cutin-band pointer-events-none fixed bottom-6 left-4 z-[55] flex max-w-[min(420px,calc(100vw-2rem))] items-end gap-2"
    >
      <div className="relative shrink-0 -skew-x-6 bg-primary-container p-1 shadow-hard-sm shadow-surface-container-lowest">
        <Image src={portrait.src} alt="" width={portrait.width} height={440} loading="eager" className="h-20 w-auto skew-x-6" />
      </div>
      <div className="relative mb-2">
        <span className="absolute -top-4 left-3 -skew-x-12 bg-secondary-fixed px-2 font-display text-[14px] uppercase tracking-wider text-on-secondary-fixed">
          {dictionary.speaker}
        </span>
        <p className="cutin-bubble bg-secondary px-4 py-3 font-hud text-[14px] font-black uppercase italic leading-tight text-surface-container-lowest">
          {dictionary[comment.moment]}
        </p>
      </div>
    </div>
  );
}
