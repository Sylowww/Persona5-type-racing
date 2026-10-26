import type { Dictionary } from "@/i18n/dictionaries/en";

/** A sample of the race text, shown as a Persona 5 dialogue box with the word being typed highlighted. */
export function TypingPreview({ dictionary }: { dictionary: Dictionary["home"]["typingPreview"] }) {
  return (
    <section className="relative rotate-1 border-2 border-secondary bg-surface-container-lowest px-5 pt-8 pb-5 shadow-[8px_8px_0_var(--color-primary-container)]">
      <h2 className="absolute -top-4 left-4 -skew-x-12 bg-secondary px-3 py-1 font-hud text-label-hud font-black uppercase tracking-widest text-surface-container-lowest shadow-hard-sm">
        {dictionary.title}
      </h2>
      <p className="mb-2 font-hud text-label-hud font-bold uppercase tracking-widest text-secondary-fixed">{dictionary.subtitle}</p>
      <p className="flex items-center gap-2 overflow-hidden whitespace-nowrap font-body text-typing-stream font-bold">
        <span className="text-on-surface-variant opacity-70">{dictionary.typed}</span>
        <span className="-skew-x-6 bg-primary-container px-1.5 text-on-primary-container">{dictionary.current}</span>
        <span className="tracking-wide text-secondary">{dictionary.upcoming}</span>
        <span aria-hidden="true" className="inline-block h-8 w-1 shrink-0 bg-secondary-fixed motion-safe:animate-pulse" />
      </p>
    </section>
  );
}
