import type { Dictionary } from "@/i18n/dictionaries/en";

export function TypingPreview({ dictionary }: { dictionary: Dictionary["home"]["typingPreview"] }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="eyebrow">{dictionary.title}</h2>
        <span className="font-hud text-label-hud font-bold uppercase tracking-widest text-on-surface-variant">{dictionary.subtitle}</span>
      </div>
      <p className="panel flex items-center gap-2 overflow-hidden whitespace-nowrap px-5 py-4 font-body text-typing-stream font-bold">
        <span className="text-on-surface-variant opacity-70">{dictionary.typed}</span>
        <span className="bg-secondary px-1.5 text-surface-container-lowest">{dictionary.current}</span>
        <span className="tracking-wide text-secondary">{dictionary.upcoming}</span>
        <span aria-hidden="true" className="inline-block h-8 w-1 shrink-0 bg-primary-container motion-safe:animate-pulse" />
      </p>
    </section>
  );
}
