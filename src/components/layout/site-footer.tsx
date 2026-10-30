import { BrandWordmark } from "@/components/layout/brand-wordmark";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function SiteFooter({ dictionary }: { dictionary: Dictionary["footer"] }) {
  return (
    <footer className="w-full border-t border-surface-container-high bg-surface-container-lowest py-8">
      <div className="flex w-full flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-10">
        <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
          <BrandWordmark className="text-headline-sm text-on-surface-variant" />
          <span className="font-hud text-label-hud font-bold uppercase tracking-widest text-on-surface-variant">
            {formatMessage(dictionary.rights, { year: new Date().getFullYear() })}
          </span>
        </div>
        <span className="font-hud text-label-hud font-bold uppercase tracking-widest text-on-surface-variant">
          {dictionary.studentProject}
        </span>
      </div>
    </footer>
  );
}
