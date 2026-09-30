"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import type { Dictionary } from "@/i18n/dictionaries/en";

type SwitchType = "clicky" | "linear";

const activeStyles: Record<SwitchType, string> = {
  clicky: "bg-primary-container text-on-primary-container",
  linear: "bg-secondary-container text-on-secondary-fixed",
};

// Only the selection is kept for now; key sounds are not implemented yet.
export function KeyAudioToggle({ dictionary }: { dictionary: Dictionary["home"]["dossier"]["keyAudio"] }) {
  const [selected, setSelected] = useState<SwitchType>("clicky");
  const options: SwitchType[] = ["clicky", "linear"];

  return (
    <div className="mt-1 flex items-center justify-between gap-2 bg-surface-container-lowest p-2 shadow-hard-xs shadow-secondary">
      <div className="flex items-center gap-1">
        <Icon name="keyboard" size={18} className="text-secondary-fixed" />
        <span id="key-audio-label" className="font-hud text-[11px] font-black uppercase tracking-wider text-secondary">
          {dictionary.label}
        </span>
      </div>
      <div role="radiogroup" aria-labelledby="key-audio-label" className="flex items-center gap-1 bg-surface-container p-0.5">
        {options.map((option) => {
          const isSelected = option === selected;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(option)}
              className={`px-2 py-0.5 font-hud text-[10px] font-black uppercase transition-colors ${
                isSelected ? activeStyles[option] : "text-on-surface-variant hover:text-secondary"
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
