"use client";

import Image from "next/image";
import { type CSSProperties, useEffect, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { characterAllOutPortrait } from "@/lib/characters";
import type { CharacterId } from "@/types/character";

type Point = readonly [x: number, y: number];

// Shattered glass: shards fan out from the bullet hole to the frame edge, in % of the collage box.
const impact: Point = [46, 58];
const rays: readonly Point[] = [[0, 30], [16, 0], [42, 0], [68, 0], [100, 6], [100, 32], [100, 58], [100, 86], [80, 100], [46, 100], [12, 100], [0, 70]];
// Frame corners a shard must wrap around, keyed by the ray it starts from.
const corners: Partial<Record<number, Point>> = { 0: [0, 0], 3: [100, 0], 7: [100, 100], 10: [0, 100] };
const cast: readonly CharacterId[] = ["crow", "skull", "panther", "queen", "violet", "oracle", "sophia", "noir", "joker", "mona", "blackMask", "fox"];

const shards = rays.map((start, index) => {
  const corner = corners[index];
  const points = [impact, start, ...(corner ? [corner] : []), rays[(index + 1) % rays.length]];
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const box = { left: Math.min(...xs), top: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
  return { character: cast[index], clipPath: `polygon(${points.map(([x, y]) => `${x}% ${y}%`).join(",")})`, box };
});

// A broken ring of secondary cracks around the impact, at 30% of the way to each ray end.
const ring = rays.map(([x, y], index) => {
  const reach = index % 2 === 0 ? 0.3 : 0.24;
  return `${impact[0] + (x - impact[0]) * reach},${impact[1] + (y - impact[1]) * reach}`;
});

type HomeHeroProps = {
  dictionary: Dictionary["home"]["hero"];
};

/**
 * Full-screen red poster shown when the site opens. While the player scrolls, the poster stays still and its bottom
 * edge rolls up like a scroll closing, revealing the home page that follows it (no overlay, so nothing is hidden behind it).
 */
export function HomeHero({ dictionary }: HomeHeroProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = ref.current;
    if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const height = hero.offsetHeight;
      const scrolled = Math.min(Math.max(window.scrollY, 0), height);
      hero.style.setProperty("--hero-scroll", `${scrolled}px`);
      hero.style.setProperty("--hero-roll", `${scrolled / height}`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section
      ref={ref}
      aria-label={dictionary.label}
      className="relative h-[calc(100svh-4rem)] min-h-[560px] overflow-clip bg-primary-container"
      style={{ "--hero-scroll": "0px", "--hero-roll": "0" } as CSSProperties}
    >
      {/* Pinned while the section scrolls away, so only its bottom edge seems to move. */}
      <div className="absolute inset-0 translate-y-(--hero-scroll)">
        <div className="mx-auto grid h-full w-full max-w-[1600px] grid-rows-[minmax(0,1fr)_auto] items-center gap-6 px-4 pt-8 pb-24 md:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-1 lg:gap-14 lg:pt-12 lg:pb-20">
          <Collage />

          <p className="ink-distress flex flex-col font-display uppercase italic leading-[0.92] text-surface-container-lowest lg:-rotate-3">
            {dictionary.lines.map(([small, big]) => (
              <span key={big} className="flex flex-wrap items-baseline gap-x-3 md:gap-x-5">
                <span className="text-[clamp(32px,5.5vw,104px)]">{small}</span>
                <span className="text-[clamp(56px,10vw,190px)] not-italic">{big}</span>
              </span>
            ))}
          </p>
        </div>

        <p className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-1 font-hud text-label-hud font-black uppercase tracking-widest text-on-primary-container">
          {dictionary.scroll}
          <Icon name="keyboard_double_arrow_down" size={28} className="motion-safe:animate-bounce" />
        </p>
      </div>

      {/* The rolled-up part: a shaded cylinder on the moving edge that thickens as more of the poster is wound. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[calc(8px+var(--hero-roll)*40px)] rounded-t-full bg-[linear-gradient(180deg,#5c0010,var(--color-primary-container)_35%,#ff7a8a_50%,#a3001b_72%,#2a0007)] opacity-[min(1,calc(var(--hero-roll)*12))] shadow-[0_10px_18px_rgb(0_0_0/0.6)]"
      />
    </section>
  );
}

/** Portraits of the thieves behind a pane of glass shattered by a single shot. */
function Collage() {
  return (
    <div aria-hidden="true" className="relative mx-auto aspect-[3/4] w-[min(100%,calc((100svh-20rem)*0.75))] lg:h-full lg:max-h-[78vh] lg:w-auto lg:max-w-full lg:justify-self-end">
      {shards.map(({ character, clipPath, box }) => (
        <div key={character} className="absolute inset-0" style={{ clipPath }}>
          <Image
            src={characterAllOutPortrait(character)}
            alt=""
            width={320}
            height={320}
            loading="eager"
            className="absolute object-cover object-top"
            style={{ left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` }}
          />
        </div>
      ))}

      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
        {rays.map(([x, y]) => (
          <line key={`${x}-${y}`} x1={impact[0]} y1={impact[1]} x2={x} y2={y} stroke="white" strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
        ))}
        <polygon points={ring.join(" ")} fill="none" stroke="white" strokeWidth={1.5} vectorEffect="non-scaling-stroke" opacity={0.85} />
      </svg>

      <span
        className="absolute aspect-square w-[9%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-container-lowest shadow-[0_0_0_4px_rgb(255_255_255/0.85),0_0_18px_6px_rgb(0_0_0/0.5)]"
        style={{ left: `${impact[0]}%`, top: `${impact[1]}%` }}
      />
    </div>
  );
}
