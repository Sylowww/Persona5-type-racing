"use client";

import { useLayoutEffect, useRef } from "react";

const SLIDE_MS = 450;

/**
 * Lane motion on the race track: when the order changes, every lane slides from its old place to its new one instead
 * of jumping (a FLIP animation), and a racer who enters the top three flashes (`.lane-rise`). Returns a ref callback
 * per racer id. Skipped when the player asks for reduced motion.
 */
export function useLaneMotion(topThreeIds: readonly string[]) {
  const lanes = useRef(new Map<string, HTMLElement>());
  const tops = useRef(new Map<string, number>());
  const topThree = useRef<ReadonlySet<string> | null>(null);

  // Runs after every render: it only reads lane positions, and the track re-renders a few times per second.
  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    for (const [id, lane] of lanes.current) {
      const top = lane.offsetTop;
      const before = tops.current.get(id);
      tops.current.set(id, top);
      if (!reduceMotion && before !== undefined && before !== top) {
        lane.animate([{ transform: `translateY(${before - top}px)` }, { transform: "translateY(0)" }], {
          duration: SLIDE_MS,
          easing: "cubic-bezier(0.2, 0.9, 0.3, 1)",
        });
      }
    }

    const previous = topThree.current;
    topThree.current = new Set(topThreeIds);
    if (!previous) return;
    for (const id of topThreeIds) {
      const lane = lanes.current.get(id);
      if (previous.has(id) || !lane) continue;
      // Restart the flash even if it is still running from an earlier entry.
      lane.classList.remove("lane-rise");
      void lane.offsetWidth;
      lane.classList.add("lane-rise");
    }
  });

  return (id: string) => (lane: HTMLElement | null) => {
    if (lane) lanes.current.set(id, lane);
    else lanes.current.delete(id);
  };
}
