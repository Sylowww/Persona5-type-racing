"use client";

import { useEffect } from "react";
import { playReveal } from "@/lib/sound-effects";

/**
 * Opens the results where the race's final collapse ended: the black wedges start closed, then split apart.
 * Pure CSS, so it is already closed on the first paint; it ignores pointer events and is aria-hidden.
 */
export function CollapseReveal() {
  useEffect(() => {
    playReveal();
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <div className="palace-reveal-top absolute inset-0 bg-surface-container-lowest" />
      <div className="palace-reveal-bottom absolute inset-0 bg-surface-container-lowest" />
      <div className="palace-reveal-seam absolute inset-x-[-10%] top-1/2 h-3 -rotate-[5deg] bg-primary-container" />
    </div>
  );
}
