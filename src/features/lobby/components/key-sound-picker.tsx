"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { KeySound } from "@/types/lobby";

const options: readonly KeySound[] = ["clicky", "tactile", "silent"];

// Only the selection is kept for now; key sounds are not implemented yet.
export function KeySoundPicker({ dictionary }: { dictionary: Dictionary["lobby"]["rules"]["audio"] }) {
  const [selected, setSelected] = useState<KeySound>("tactile");

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span id="key-sound-label" className="font-hud text-[11px] font-black uppercase tracking-widest text-primary">
          {dictionary.title}
        </span>
        <Icon name="graphic_eq" size={18} className="text-secondary" />
      </div>
      <div role="radiogroup" aria-labelledby="key-sound-label" className="grid grid-cols-3 gap-2">
        {options.map((option) => {
          const isSelected = option === selected;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(option)}
              className={`py-2 text-center font-hud text-label-hud font-black uppercase transition-colors ${
                isSelected
                  ? "bg-secondary-fixed text-on-secondary-fixed shadow-hard-xs"
                  : "bg-surface-container-low text-on-surface hover:bg-surface-bright"
              }`}
            >
              {dictionary[option]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
