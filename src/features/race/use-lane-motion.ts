"use client";

import { useLayoutEffect, useRef } from "react";

const SLIDE_MS = 550;

/**
 * Lane motion on the race track: when the order changes, every lane slides and flips from its old place to its new one
 * instead of jumping (a FLIP animation), and a racer who enters the top three flashes (`.lane-rise`). Returns a ref
 * callback per racer id. Skipped when the player asks for reduced motion.
 */
export function useLaneMotion(laneIds: readonly string[], topThreeIds: readonly string[]) {
  const lanes = useRef(new Map<string, HTMLElement>());
  const tops = useRef(new Map<string, number>());
  const order = useRef("");
  const topThree = useRef<ReadonlySet<string> | null>(null);

  // Runs after every render, but reads lane positions only when the order changed: the track re-renders several times
  // per second, and each read forces a layout of the whole page.
  const laneOrder = laneIds.join(",");
  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasMoved = order.current !== laneOrder;
    order.current = laneOrder;
    for (const [id, lane] of hasMoved ? lanes.current : []) {
      const top = lane.offsetTop;
      const before = tops.current.get(id);
      tops.current.set(id, top);
      if (!reduceMotion && before !== undefined && before !== top) {
        // Flips over on its way, like a split-flap board: forward when climbing, backward when dropping.
        const flip = before > top ? -70 : 70;
        lane.animate(
          [
            { transform: `perspective(800px) translateY(${before - top}px) rotateX(${flip}deg)` },
            { transform: `perspective(800px) translateY(0) rotateX(${flip / -7}deg)`, offset: 0.7 },
            { transform: "perspective(800px) translateY(0) rotateX(0deg)" },
          ],
          { duration: SLIDE_MS, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" },
        );
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
