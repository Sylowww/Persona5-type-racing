"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { botDifficulties } from "@/lib/bots";
import { characterIds } from "@/lib/characters";
import { botTargetWpm } from "@/lib/lobby";
import type { CharacterId } from "@/types/character";
import type { BotDifficulty } from "@/types/lobby";

type AddBotCardProps = {
  dictionary: Dictionary["lobby"]["bots"];
  characterNames: Record<CharacterId, string>;
  wpmLabel: string;
  isPending: boolean;
  /** `character` is the host's pick, or null for a random one. */
  onAdd: (difficulty: BotDifficulty, character: CharacterId | null) => void;
};

const buttonStyles: Record<BotDifficulty, { button: string; wpm: string }> = {
  noob: { button: "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-bright", wpm: "text-outline" },
  novice: { button: "bg-surface-container-low text-on-surface-variant hover:bg-surface-bright", wpm: "text-outline" },
  rookie: { button: "bg-surface-container text-on-surface hover:bg-surface-bright", wpm: "text-outline" },
  master: {
    button: "bg-surface-container-highest text-secondary hover:bg-primary-container hover:text-on-primary-container",
    wpm: "text-secondary-fixed",
  },
  godspeed: {
    button: "bg-surface-container text-on-surface hover:bg-secondary-fixed hover:text-on-secondary-fixed",
    wpm: "text-primary-container",
  },
};

/** Host only: each button adds one bot of that difficulty, so bots in a lobby can all differ. */
export function AddBotCard({ dictionary, characterNames, wpmLabel, isPending, onAdd }: AddBotCardProps) {
  // The host picks who the bot races as (and so which Persona power it casts), or leaves it to chance.
  const [character, setCharacter] = useState<CharacterId | null>(null);
  return (
    <li className="relative h-[290px]">
      <div aria-hidden="true" className="absolute inset-0 rotate-1 translate-x-1 translate-y-1 bg-surface-container-high" />
      <section className="relative flex h-full flex-col justify-between bg-surface-container-low p-4">
        <div className="flex items-center justify-between">
          <span className="bg-surface-bright px-2 py-0.5 font-display text-[14px] uppercase italic tracking-wider text-secondary">
            {dictionary.badge}
          </span>
          <Icon name="smart_toy" className="text-outline" />
        </div>
        <div className="flex flex-col">
          <h3 className="font-hud text-headline-sm font-black uppercase italic leading-tight text-secondary">{dictionary.title}</h3>
          <label className="mt-1 flex items-center justify-between gap-2 font-hud text-[11px] font-black uppercase tracking-wider text-on-surface-variant">
            {dictionary.character}
            <select
              value={character ?? ""}
              disabled={isPending}
              onChange={(event) => setCharacter(characterIds.find((id) => id === event.target.value) ?? null)}
              className="min-w-0 flex-1 bg-surface-container-lowest px-2 py-1 font-hud text-[12px] font-black uppercase text-secondary"
            >
              <option value="">{dictionary.randomCharacter}</option>
              {characterIds.map((id) => (
                <option key={id} value={id}>
                  {characterNames[id]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-col gap-1.5">
          {botDifficulties.map((difficulty) => (
            <button
              key={difficulty}
              type="button"
              disabled={isPending}
              onClick={() => onAdd(difficulty, character)}
              className={`group flex w-full items-center justify-between px-2 py-1 text-left transition-colors disabled:opacity-60 ${buttonStyles[difficulty].button}`}
            >
              <span className="font-bold uppercase">{dictionary.difficulties[difficulty]}</span>
              <span className={`font-hud text-[13px] font-black group-hover:text-current ${buttonStyles[difficulty].wpm}`}>
                {formatMessage(wpmLabel, { wpm: botTargetWpm[difficulty] })}
              </span>
            </button>
          ))}
        </div>
      </section>
    </li>
  );
}
