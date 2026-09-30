import { BrandWordmark } from "@/components/layout/brand-wordmark";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";

const APP_VERSION = "4.8.1-P5";

export function SiteFooter({ dictionary }: { dictionary: Dictionary["footer"] }) {
  const items = [dictionary.status, dictionary.encryption, formatMessage(dictionary.version, { version: APP_VERSION })];

  return (
    <footer className="w-full bg-surface-container-lowest py-7">
      <div className="flex w-full flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-10">
        <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
          <BrandWordmark className="text-on-surface-variant" />
          <span className="font-hud text-label-hud font-black uppercase tracking-widest text-on-surface-variant">
            {formatMessage(dictionary.rights, { year: new Date().getFullYear() })}
          </span>
        </div>
        <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
          {items.map((item) => (
            <li key={item} className="font-hud text-label-hud font-black uppercase tracking-wider text-on-surface-variant">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
