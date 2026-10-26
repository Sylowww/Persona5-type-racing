import type { Dictionary } from "@/i18n/dictionaries/en";

// Ransom-note letters, like the Phantom Thieves' calling cards: each one cut from a different "magazine".
const cutouts = [
  "bg-secondary text-surface-container-lowest font-display",
  "bg-surface-container-lowest text-secondary font-hud font-black border-2 border-secondary",
  "bg-primary-container text-on-primary-container font-display italic",
  "text-secondary font-body font-bold",
  "bg-secondary text-primary-container font-hud font-black",
  "bg-surface-container-lowest text-secondary-fixed font-display",
  "bg-primary-container text-surface-container-lowest font-hud font-black",
];
const tilts = [-7, 4, -3, 6, -5, 2, 8, -4, 3, -6];
const sizes = ["text-[1em]", "text-[0.82em]", "text-[1.08em]", "text-[0.9em]"];

function Cutout({ letter, index }: { letter: string; index: number }) {
  return (
    <span
      className={`inline-block px-[0.12em] leading-[1.05] uppercase shadow-hard-sm ${cutouts[index % cutouts.length]} ${sizes[(index * 3) % sizes.length]}`}
      style={{ transform: `rotate(${tilts[index % tilts.length]}deg)` }}
    >
      {letter}
    </span>
  );
}

/** "Take their words!" spelled out in cut-out letters. Decorative: the page heading carries the text for screen readers. */
export function CallingCardBanner({ dictionary }: { dictionary: Dictionary["home"]["callingCard"] }) {
  let index = 0;
  const words = `${dictionary.take} ${dictionary.words}`.split(" ");

  return (
    <div aria-hidden="true" className="flex flex-wrap items-center gap-x-[0.45em] gap-y-2 text-[clamp(2.25rem,5vw,4.5rem)]">
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="flex items-center gap-[0.06em]">
          {[...word].map((letter) => {
            index += 1;
            return <Cutout key={index} letter={letter} index={index} />;
          })}
        </span>
      ))}
    </div>
  );
}
