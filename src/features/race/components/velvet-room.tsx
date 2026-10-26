import type { Dictionary } from "@/i18n/dictionaries/en";

/** Drapes and gold chains behind a training race; pair it with the `velvet-room` class on the page. Decorative. */
export function VelvetRoomDecor() {
  return (
    <div aria-hidden="true" className="velvet-curtains">
      <div className="velvet-chain velvet-chain-left" />
      <div className="velvet-chain velvet-chain-right" />
    </div>
  );
}

/** One line from a Velvet Room attendant (Lavenza before the training, Igor after it). */
export function VelvetRoomLine({ dictionary, speaker, line }: { dictionary: Dictionary["race"]["velvetRoom"]; speaker: string; line: string }) {
  return (
    <section className="mx-auto mb-6 flex max-w-3xl flex-col items-center gap-1 text-center">
      <span className="eyebrow">{dictionary.kicker}</span>
      <p className="text-body-md text-on-surface">
        <span className="font-hud font-black uppercase tracking-widest text-secondary-fixed">{speaker}</span> — <span className="italic">{line}</span>
      </p>
    </section>
  );
}
