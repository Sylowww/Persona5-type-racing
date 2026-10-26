"use client";

import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { useCopyText } from "../use-copy-text";

type EmptySlotCardProps = {
  dictionary: Dictionary["lobby"]["roster"];
  slot: number;
  code: string;
};

export function EmptySlotCard({ dictionary, slot, code }: EmptySlotCardProps) {
  const { copied, copy } = useCopyText(code);

  return (
    <li className="relative h-[290px]">
      <button
        type="button"
        onClick={copy}
        className="group relative flex size-full flex-col items-center justify-center border border-dashed border-surface-container-highest p-4 text-center transition-colors hover:border-primary-container hover:bg-surface-container-low"
      >
        <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-surface-container-high text-secondary transition-colors group-hover:bg-primary-container group-hover:text-on-primary-container">
          <Icon name="person_add" size={32} />
        </span>
        <span className="font-display text-headline-sm uppercase italic tracking-wide text-secondary">
          {formatMessage(dictionary.emptySlot, { slot })}
        </span>
        <span className="mt-1 font-hud text-label-hud font-black uppercase tracking-widest text-on-surface-variant">
          {dictionary.invite}
        </span>
        <span
          aria-live="polite"
          className="mt-4 border border-surface-container-highest px-3 py-1 font-hud text-[11px] font-black uppercase tracking-wider text-secondary transition-colors group-hover:border-secondary-fixed"
        >
          {copied ? dictionary.copied : dictionary.copyCode}
        </span>
      </button>
    </li>
  );
}
