import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";

// Races are not saved yet, so the history is always empty for now.
export function RaceHistory({ locale, dictionary }: { locale: Locale; dictionary: Dictionary["profile"]["history"] }) {
  return (
    <section className="flex flex-col gap-3 bg-surface-container p-5 shadow-hard-md shadow-secondary">
      <h2 className="font-hud text-headline-sm font-black uppercase italic tracking-wider text-secondary">{dictionary.title}</h2>
      <div className="flex flex-col items-center gap-3 bg-surface-container-lowest px-4 py-8 text-center">
        <Icon name="timer" size={40} className="text-primary-container" />
        <p className="text-on-surface-variant">{dictionary.empty}</p>
        <Link
          href={`/${locale}/race`}
          className="-skew-x-6 bg-primary-container px-4 py-2 font-hud text-label-hud font-black uppercase italic text-on-primary-container shadow-hard-sm shadow-secondary hover:bg-secondary-container hover:text-on-secondary-fixed"
        >
          {dictionary.cta}
        </Link>
      </div>
    </section>
  );
}
