import type { Dictionary } from "@/i18n/dictionaries/en";

export function TypingPreview({ dictionary }: { dictionary: Dictionary["home"]["typingPreview"] }) {
  return (
    <section className="relative flex flex-col gap-2 bg-surface-container-lowest p-4 shadow-hard-md shadow-surface-container-high">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-primary-container motion-safe:animate-pulse" />
          <h2 className="font-hud text-label-hud font-black uppercase tracking-widest text-primary-container">{dictionary.title}</h2>
        </div>
        <span className="font-hud text-label-hud font-black uppercase text-on-surface-variant">{dictionary.subtitle}</span>
      </div>
      <p className="flex items-center gap-2 overflow-hidden whitespace-nowrap bg-surface-container-high p-4 font-body text-typing-stream font-bold">
        <span className="text-on-surface-variant line-through opacity-70">{dictionary.typed}</span>
        <span className="rotate-[-2deg] bg-secondary px-2 py-0.5 text-surface-container-lowest shadow-hard-xs shadow-primary-container">
          {dictionary.current}
        </span>
        <span className="tracking-wide text-secondary">{dictionary.upcoming}</span>
        <span aria-hidden="true" className="inline-block h-8 w-3 shrink-0 bg-primary-container motion-safe:animate-ping" />
      </p>
    </section>
  );
}
