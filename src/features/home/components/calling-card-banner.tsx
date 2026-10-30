import { RansomText } from "@/components/ui/ransom-text";
import type { Dictionary } from "@/i18n/dictionaries/en";

/** "Take their words!" spelled out in cut-out letters. Decorative: the page heading carries the text for screen readers. */
export function CallingCardBanner({ dictionary }: { dictionary: Dictionary["home"]["callingCard"] }) {
  return (
    <div aria-hidden="true">
      <RansomText text={`${dictionary.take} ${dictionary.words}`} className="text-[clamp(2.25rem,5vw,4.5rem)]" />
    </div>
  );
}
