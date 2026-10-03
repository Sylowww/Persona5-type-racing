"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { revealedLength, type CutInTimeline } from "@/lib/cut-in";
import { playCutInSwoosh, playVoiceBlip, playVoiceLine } from "@/lib/sound-effects";

const TICK_MS = 30;

/**
 * Clock of a cut-in: milliseconds since it appeared (null before `delayMs` or when `play` is false).
 * Plays the swoosh when it appears, then the recorded `voice` line if there is one, otherwise a "voice" blip
 * every other letter while the line is typed out.
 */
export function useCutInClock(
  play: boolean,
  line: string,
  timeline: CutInTimeline,
  options: { delayMs?: number; voice?: string } = {},
): number | null {
  const { delayMs = 0, voice } = options;
  const [elapsed, setElapsed] = useState<number | null>(null);
  const shownRef = useRef(0);

  useEffect(() => {
    if (!play) return;
    let timer = 0;
    const delay = window.setTimeout(() => {
      playCutInSwoosh();
      if (voice) playVoiceLine(voice);
      const start = performance.now();
      timer = window.setInterval(() => {
        const ms = performance.now() - start;
        setElapsed(ms);
        const shown = revealedLength(ms, line.length, timeline);
        if (!voice && Math.floor(shown / 2) > Math.floor(shownRef.current / 2) && line[shown - 1] !== " ") playVoiceBlip();
        shownRef.current = shown;
        if (ms >= timeline.endsAt) window.clearInterval(timer);
      }, TICK_MS);
    }, delayMs);
    return () => {
      window.clearTimeout(delay);
      window.clearInterval(timer);
    };
  }, [play, line, timeline, delayMs, voice]);

  return elapsed;
}

type CutInBandProps = {
  speaker: string;
  line: string;
  /** Characters of the line already typed out. */
  shownLength: number;
  leaving: boolean;
  /** The character, shown on the red panel at the left of the band. */
  visual: ReactNode;
  /** Vertical placement of the fixed band, e.g. `top-[16vh]`. */
  className?: string;
};

/**
 * Persona-style cut-in: a tilted black band with a red panel, a name tag and a jagged speech bubble.
 * Decorative (aria-hidden, no pointer events); see `.cutin-*` in globals.css for the motion.
 */
export function CutInBand({ speaker, line, shownLength, leaving, visual, className = "" }: CutInBandProps) {
  const shown = line.slice(0, shownLength);

  return (
    <div aria-hidden="true" className={`pointer-events-none fixed inset-x-0 z-[65] -rotate-3 ${className}`}>
      <div className={`relative ${leaving ? "cutin-band-leave" : "cutin-band"}`}>
        <div className="absolute inset-x-[-5%] -top-2 h-2 bg-primary-container" />
        <div className="absolute inset-x-[-5%] -bottom-2 h-2 bg-primary-container" />
        <div className="absolute inset-0 overflow-hidden bg-surface-container-lowest/95">
          <div className="absolute inset-y-0 left-0 w-28 -skew-x-12 bg-primary-container md:left-[6vw] md:w-56" />
        </div>
        <div className="relative flex h-[150px] items-center gap-2 px-4 md:h-[190px] md:gap-4 md:px-[8vw]">
          <div className="cutin-pop relative shrink-0">{visual}</div>
          <div className="cutin-pop relative min-w-0 max-w-3xl flex-1">
            <span className="absolute -top-5 left-4 z-10 -skew-x-12 bg-secondary-fixed px-3 py-0.5 font-display text-[16px] uppercase tracking-wider text-on-secondary-fixed shadow-hard-xs md:left-6 md:text-[20px]">
              {speaker}
            </span>
            <p className="cutin-bubble bg-secondary px-5 py-4 font-hud text-[15px] font-black uppercase italic leading-tight text-surface-container-lowest md:px-8 md:py-5 md:text-[26px]">
              {/* The full line keeps the bubble's size while the visible part is typed out. */}
              <span>{shown}</span>
              <span className="invisible">{line.slice(shown.length)}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
