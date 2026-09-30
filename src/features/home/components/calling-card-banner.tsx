import type { Dictionary } from "@/i18n/dictionaries/en";

export function CallingCardBanner({ dictionary }: { dictionary: Dictionary["home"]["callingCard"] }) {
  return (
    <div aria-hidden="true" className="relative mt-2">
      <div className="absolute -inset-1 translate-x-2 translate-y-2.5 rotate-[-1.5deg] bg-surface-container-lowest" />
      <div className="relative flex rotate-[-2.5deg] flex-wrap items-center justify-between gap-4 bg-primary-container p-4 shadow-hard-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex size-12 rotate-6 items-center justify-center bg-surface-container-lowest shadow-hard-sm shadow-secondary-fixed">
            <span className="font-display text-headline-md italic leading-none text-secondary-fixed">★</span>
          </div>
          <div className="rotate-[-3deg] bg-secondary px-4 py-1.5 text-surface-container-lowest shadow-hard-md">
            <span className="font-display text-headline-md uppercase md:text-headline-lg italic leading-none tracking-wider">{dictionary.take}</span>
          </div>
          <div className="rotate-[3.5deg] bg-surface-container-lowest px-5 py-1.5 text-secondary shadow-hard-md shadow-secondary-fixed">
            <span className="font-display text-headline-md uppercase md:text-headline-lg italic leading-none tracking-wider">{dictionary.words}</span>
          </div>
        </div>
        <div className="rotate-[-6deg] bg-secondary-container px-3 py-1 font-hud text-label-hud font-black uppercase tracking-widest text-on-secondary-fixed shadow-hard-xs">
          {dictionary.tag}
        </div>
      </div>
    </div>
  );
}
