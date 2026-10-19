import { charStatus, splitWords, type CharStatus } from "@/lib/typing";

const charClass: Record<CharStatus, string> = {
  correct: "text-secondary",
  incorrect: "bg-error-container text-secondary-fixed underline decoration-primary-container decoration-2",
  pending: "text-on-surface-variant/60",
};

type TypingTextProps = {
  text: string;
  typed: string;
  /** The last key was wrong and not typed (blocking mode): mark the character waiting to be fixed. */
  blocked?: boolean;
  /** Fog bonus: the words after the cursor are blurred. */
  fog?: boolean;
};

/** The target text, colored by what was typed. Kept flat and calm: no rotation on the text itself. */
export function TypingText({ text, typed, blocked = false, fog = false }: TypingTextProps) {
  // Each word keeps its trailing space so a mistyped space is visible.
  return (
    <p aria-hidden="true" className="flex flex-wrap gap-y-2 font-body text-typing-stream font-bold select-none">
      {splitWords(text).map(({ start, chars }) => {
        return (
          <span key={start} className={`whitespace-pre transition-[filter] ${fog && start > typed.length ? "blur-sm" : ""}`}>
            {[...chars].map((char, charIndex) => {
              const index = start + charIndex;
              return (
                <span key={index} className={`relative ${charClass[blocked && index === typed.length ? "incorrect" : charStatus(text, typed, index)]}`}>
                  {index === typed.length && (
                    <span className="absolute top-1 -left-0.5 h-9 w-[3px] bg-primary-container shadow-[0_0_8px] shadow-primary-container motion-safe:animate-pulse" />
                  )}
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
