"use client";

import { Icon } from "@/components/ui/icon";
import { useCopyText } from "../use-copy-text";

type CopyCodeButtonProps = {
  code: string;
  label: string;
  copiedLabel: string;
};

export function CopyCodeButton({ code, label, copiedLabel }: CopyCodeButtonProps) {
  const { copied, copy } = useCopyText(code);

  return (
    <button
      type="button"
      onClick={copy}
      className={`flex shrink-0 items-center gap-1 px-2 py-1.5 font-hud text-label-hud font-black uppercase shadow-hard-xs shadow-secondary-fixed transition-transform active:scale-95 ${
        copied
          ? "bg-secondary-fixed text-on-secondary-fixed"
          : "bg-surface-container-lowest text-secondary hover:bg-secondary-fixed hover:text-on-secondary-fixed"
      }`}
    >
      <Icon name={copied ? "check" : "content_copy"} size={16} />
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}
