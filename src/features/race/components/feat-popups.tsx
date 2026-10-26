import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Feat } from "@/lib/race-feats";

/** A feat popup at the character where it was earned. */
export type FeatPopupItem = { id: number; feat: Exclude<Feat, "oneMore">; index: number; at: number };

/** How long a popup floats above the text. */
export const FEAT_POPUP_MS = 900;
/** How long the "1 MORE!" burst stays over the typing area. */
export const ONE_MORE_MS = 1_300;

const featStyle: Record<FeatPopupItem["feat"], string> = {
  miss: "bg-surface-container-lowest text-on-surface-variant text-[18px]",
  technical: "bg-secondary-fixed text-on-secondary-fixed text-[22px]",
  critical: "bg-primary-container text-secondary text-[26px]",
};

/** Persona 5 style "damage number" above a character: tilted, outlined, floating up. Rendered inside the character's span. */
export function FeatPopup({ dictionary, feat }: { dictionary: Dictionary["race"]["feats"]; feat: FeatPopupItem["feat"] }) {
  return (
    <span
      className={`feat-pop pointer-events-none absolute bottom-full left-1/2 z-10 -skew-x-12 whitespace-nowrap px-2 font-display uppercase leading-tight shadow-[3px_3px_0_var(--color-secondary)] ${featStyle[feat]}`}
    >
      {dictionary[feat]}
    </span>
  );
}

/** "1 MORE!" over the typing area after a run of perfect words; decorative, the words stay readable around it. */
export function OneMoreBurst({ dictionary, words }: { dictionary: Dictionary["race"]["feats"]; words: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-6 z-20 flex justify-center">
      <div className="one-more flex -rotate-6 flex-col items-center">
        <span className="bg-surface-container-lowest px-5 font-display text-[56px] uppercase italic leading-tight text-secondary-fixed shadow-[6px_6px_0_var(--color-primary-container)]">
          {dictionary.oneMore}
        </span>
        <span className="-mt-1 bg-secondary px-3 font-hud text-label-hud font-black uppercase tracking-widest text-surface-container-lowest">
          {formatMessage(dictionary.perfectWords, { count: words })}
        </span>
      </div>
    </div>
  );
}
