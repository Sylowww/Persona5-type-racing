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
      className={`flex shrink-0 items-center gap-1.5 border px-3 py-1.5 font-hud text-label-hud font-black uppercase tracking-wider transition-colors ${
        copied ? "border-secondary-fixed bg-secondary-fixed text-on-secondary-fixed" : "border-surface-container-highest text-secondary hover:border-secondary-fixed"
      }`}
    >
      <Icon name={copied ? "check" : "content_copy"} size={16} />
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}
