"use client";

import { type CSSProperties, useEffect, useRef } from "react";

// Faint four-point stars scattered behind the page: [left %, top %, size px, depth px].
const stars: readonly (readonly [number, number, number, number])[] = [
  [8, 12, 18, 40],
  [22, 64, 10, 60],
  [41, 30, 14, 25],
  [63, 78, 20, 50],
  [78, 18, 12, 70],
  [90, 52, 16, 35],
  [52, 92, 10, 65],
];

/**
 * Flat ink page with the signature red slash in the top corner (see `phantom-slash` in globals.css). With a mouse, the
 * slash and a few faint stars drift with the pointer, each at its own depth (`.backdrop-layer`).
 */
export function PageBackdrop() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const backdrop = ref.current;
    if (!backdrop || !window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;

    let frame = 0;
    const onPointerMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        backdrop.style.setProperty("--parallax-x", (0.5 - event.clientX / window.innerWidth).toFixed(3));
        backdrop.style.setProperty("--parallax-y", (0.5 - event.clientY / window.innerHeight).toFixed(3));
      });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Bleeds past the page so the slash never shows its edge while it drifts. */}
      <div className="backdrop-layer absolute -inset-12" style={{ "--depth": "24px" } as CSSProperties}>
        <div className="phantom-slash" />
      </div>
      {stars.map(([left, top, size, depth]) => (
        <span
          key={`${left}-${top}`}
          className="backdrop-layer absolute bg-secondary-fixed/15 [clip-path:polygon(50%_0,62%_38%,100%_50%,62%_62%,50%_100%,38%_62%,0_50%,38%_38%)]"
          style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, "--depth": `${depth}px` } as CSSProperties}
        />
      ))}
    </div>
  );
}
