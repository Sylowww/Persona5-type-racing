import type { Dictionary } from "@/i18n/dictionaries/en";
import { charStatus, splitWords, type CharStatus } from "@/lib/typing";
import type { SpellElement } from "@/types/race";
import { FeatPopup, type FeatPopupItem } from "./feat-popups";

const charClass: Record<CharStatus, string> = {
  correct: "text-secondary",
  incorrect: "bg-error-container text-secondary-fixed underline decoration-primary-container decoration-2",
  pending: "text-on-surface-variant/60",
};

/**
 * Letters still to type in the current word, cut from different "magazines" like a calling card. Only colors and a
 * tilt change (no font, size or padding), so the line never reflows as the cursor moves.
 */
const ransomClasses = ["ransom-a", "ransom-b", "ransom-c", "ransom-d"] as const;
const ransomTilts = [-4, 3, -2, 5, -3, 2] as const;

type TypingTextProps = {
  text: string;
  typed: string;
  /** The last key was wrong and not typed (blocking mode): mark the character waiting to be fixed. */
  blocked?: boolean;
  /** A spell's hex on the words after the cursor (fire, psy, light, curse); null when none. */
  hex?: SpellElement | null;
  /** A calling card blacks out the words after the cursor. */
  redacted?: boolean;
  /** Feat popups ("MISS", "TECHNICAL!") floating above the characters that earned them. */
  popups?: readonly FeatPopupItem[];
  featsDictionary?: Dictionary["race"]["feats"];
};

/** The target text, colored by what was typed. The text itself stays flat; only the current word's letters tilt. */
export function TypingText({ text, typed, blocked = false, hex = null, redacted = false, popups = [], featsDictionary }: TypingTextProps) {
  // Each word keeps its trailing space so a mistyped space is visible.
  return (
    <p aria-hidden="true" className="flex flex-wrap gap-y-2 font-body text-typing-stream font-bold select-none">
      {splitWords(text).map(({ start, chars }) => {
        const isAhead = start > typed.length;
        const isCurrent = !isAhead && typed.length < start + chars.length;
        // Kouga's flash covers the whole area instead (see live-race), so it adds nothing to the words.
        const hidden = isAhead && redacted ? "card-redacted" : isAhead && hex && hex !== "bless" ? `spell-hex-${hex}` : "";
        return (
          <span key={start} className={`whitespace-pre transition-[filter] ${hidden}`}>
            {[...chars].map((char, charIndex) => {
              const index = start + charIndex;
              const status = blocked && index === typed.length ? "incorrect" : charStatus(text, typed, index);
              const isRansom = isCurrent && status === "pending" && char !== " ";
              return (
                <span
                  key={index}
                  className={`relative ${isRansom ? `ransom-letter ${ransomClasses[index % ransomClasses.length]}` : charClass[status]}`}
                  style={isRansom ? { rotate: `${ransomTilts[index % ransomTilts.length]}deg` } : undefined}
                >
                  {index === typed.length && (
                    <span className="absolute top-1 -left-0.5 z-[1] h-9 w-[3px] bg-primary-container shadow-[0_0_8px] shadow-primary-container motion-safe:animate-pulse" />
                  )}
                  {featsDictionary &&
                    popups
                      .filter((popup) => popup.index === index)
                      .map((popup) => <FeatPopup key={popup.id} dictionary={featsDictionary} feat={popup.feat} />)}
                  {char}
                </span>
              );
            })}
          </span>
        );
      })}
    </p>
  );
}
