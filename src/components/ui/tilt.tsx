"use client";

import { type PointerEvent, type ReactNode, useRef } from "react";

type TiltProps = {
  children: ReactNode;
  className?: string;
  /** Strongest tilt in degrees, reached at the card's edges. */
  max?: number;
  /** Light that follows the pointer: a white shine, a rainbow foil (tarot cards) or none. */
  glare?: "shine" | "holo" | "none";
};

/**
 * Leans its content toward the mouse in 3D (`.tilt-3d` in globals.css), with a glare under the pointer. Children marked
 * `.tilt-pop` float above the card. Touch and pen are ignored, and reduced motion keeps the card flat.
 */
export function Tilt({ children, className = "", max = 8, glare = "shine" }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const card = ref.current;
    if (!card || event.pointerType !== "mouse") return;
    const box = card.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      card.style.setProperty("--tilt-x", `${((0.5 - y) * max * 2).toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${((x - 0.5) * max * 2).toFixed(2)}deg`);
      card.style.setProperty("--glare-x", `${(x * 100).toFixed(1)}%`);
      card.style.setProperty("--glare-y", `${(y * 100).toFixed(1)}%`);
      card.dataset.tilting = "";
    });
  }

  function onPointerLeave() {
    const card = ref.current;
    cancelAnimationFrame(frame.current);
    if (!card) return;
    for (const name of ["--tilt-x", "--tilt-y", "--glare-x", "--glare-y"]) card.style.removeProperty(name);
    delete card.dataset.tilting;
  }

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={`tilt-3d ${glare === "none" ? "" : `tilt-glare tilt-glare-${glare}`} ${className}`}
    >
      {children}
    </div>
  );
}
