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
      <div aria-hidden="true" className="absolute inset-0 -rotate-1 translate-x-1 translate-y-1 bg-surface-container-high" />
      <button
        type="button"
        onClick={copy}
        className="group relative flex size-full flex-col items-center justify-center bg-surface-container-low/70 p-4 text-center transition-colors hover:bg-surface-container"
      >
        <span className="mb-2 flex size-16 items-center justify-center rounded-full bg-surface-container-highest text-secondary shadow-hard-md transition-all group-hover:scale-110 group-hover:bg-primary-container">
          <Icon name="person_add" size={32} />
        </span>
        <span className="font-hud text-headline-sm font-black uppercase italic text-secondary">
          {formatMessage(dictionary.emptySlot, { slot })}
        </span>
        <span className="mt-1 font-hud text-label-hud font-black uppercase tracking-widest text-on-surface-variant">
          {dictionary.invite}
        </span>
        <span
          aria-live="polite"
          className="mt-4 bg-surface-container-highest px-4 py-1 font-hud text-[11px] font-black uppercase tracking-wider text-secondary transition-colors group-hover:bg-secondary-fixed group-hover:text-on-secondary-fixed"
        >
          {copied ? dictionary.copied : dictionary.copyCode}
        </span>
      </button>
    </li>
  );
}
