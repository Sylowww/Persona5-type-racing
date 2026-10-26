import type { Dictionary } from "@/i18n/dictionaries/en";

/** Home hero: the slogan in big type, with the last word cut out on a red card. */
export function CallingCardBanner({ dictionary }: { dictionary: Dictionary["home"]["callingCard"] }) {
  const type = "font-display text-[clamp(3rem,6.5vw,5.75rem)] uppercase italic leading-[0.95] tracking-wide";

  return (
    <div aria-hidden="true" className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <span className={`${type} text-secondary`}>{dictionary.take}</span>
      <span className={`${type} -rotate-3 bg-primary-container px-4 text-on-primary-container shadow-hard-lg`}>{dictionary.words}</span>
    </div>
  );
}
