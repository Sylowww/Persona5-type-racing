"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { SpriteFrames } from "@/components/ui/sprite-frames";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { characterSprite } from "@/lib/characters";
import type { QuickMatchRacer } from "@/lib/lobby-store";
import { playCutInSwoosh, playRumble } from "@/lib/sound-effects";

type VersusScreenProps = {
  dictionary: Dictionary["quick"]["versus"];
  characterNames: Dictionary["profile"]["character"]["names"];
  botNames: Dictionary["lobby"]["bots"]["difficulties"];
  /** The viewer first, then their rival. */
  racers: readonly QuickMatchRacer[];
};

/**
 * Full-screen "P1 VS P2" splash shown when a quick 1v1 is found, before the race page opens.
 * Rendered in `document.body` so it covers the site header (the page content is its own stacking context).
 */
export function VersusScreen({ dictionary, characterNames, botNames, racers }: VersusScreenProps) {
  const [you, rival] = racers;
  const played = useRef(false);

  // The ref keeps the sounds from playing twice when development mode runs effects twice.
  useEffect(() => {
    if (played.current) return;
    played.current = true;
    playCutInSwoosh();
    const slam = window.setTimeout(() => playRumble(0.8, 500), 450);
    return () => window.clearTimeout(slam);
  }, []);

  if (!you || !rival) return null;
  const label = formatMessage(dictionary.label, { you: you.name, rival: rival.name });

  return createPortal(
    <div role="alert" aria-label={label} className="fixed inset-0 z-[80] overflow-hidden bg-surface-container-lowest">
      <div className="versus-side-left absolute inset-y-0 left-0 w-[58%] bg-primary-container [clip-path:polygon(0_0,100%_0,82%_100%,0_100%)]">
        <Fighter racer={you} tag={dictionary.you} subtitle={characterNames[you.character]} align="left" />
      </div>
      <div className="versus-side-right absolute inset-y-0 right-0 w-[58%] bg-surface-container-high [clip-path:polygon(18%_0,100%_0,100%_100%,0_100%)]">
        <Fighter
          racer={rival}
          tag={rival.bot ? dictionary.bot : dictionary.rival}
          subtitle={rival.bot ? botNames[rival.bot] : characterNames[rival.character]}
          align="right"
        />
      </div>
      <div aria-hidden="true" className="versus-flash pointer-events-none absolute inset-0 bg-secondary" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          aria-hidden="true"
          className="versus-slam -skew-x-12 bg-secondary-fixed px-6 font-display text-[clamp(96px,18vw,220px)] italic leading-none text-on-secondary-fixed shadow-[10px_10px_0_var(--color-surface-container-lowest)]"
        >
          {dictionary.vs}
        </span>
      </div>
    </div>,
    document.body,
  );
}

type FighterProps = { racer: QuickMatchRacer; tag: string; subtitle: string; align: "left" | "right" };

function Fighter({ racer, tag, subtitle, align }: FighterProps) {
  const isLeft = align === "left";
  return (
    <div className={`flex h-full flex-col justify-center gap-4 px-6 md:px-14 ${isLeft ? "items-start" : "items-end text-right"}`}>
      {/* Both fighters face the middle. */}
      <div className={isLeft ? "" : "-scale-x-100"}>
        <SpriteFrames character={characterSprite(racer.character)} animation="idle" size={220} className="max-md:scale-75" />
      </div>
      <span
        className={`w-fit px-2 py-0.5 font-hud text-label-hud font-black uppercase tracking-widest ${
          isLeft ? "bg-surface-container-lowest text-secondary-fixed" : "bg-primary-container text-on-primary-container"
        }`}
      >
        {tag}
      </span>
      <span className="max-w-[38vw] truncate font-display text-[clamp(32px,5vw,64px)] uppercase italic leading-none tracking-wider text-secondary">
        {racer.name}
      </span>
      <span className={`font-hud text-label-hud font-black uppercase tracking-widest ${isLeft ? "text-on-primary-container" : "text-secondary-fixed"}`}>
        {subtitle}
      </span>
    </div>
  );
}
