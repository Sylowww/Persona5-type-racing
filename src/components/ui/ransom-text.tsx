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

export function Cutout({ letter, index }: { letter: string; index: number }) {
  return (
    <span
      className={`inline-block px-[0.12em] leading-[1.05] uppercase shadow-hard-sm ${cutouts[index % cutouts.length]} ${sizes[(index * 3) % sizes.length]}`}
      style={{ transform: `rotate(${tilts[index % tilts.length]}deg)` }}
    >
      {letter}
    </span>
  );
}

/** A short line spelled out in cut-out letters. Decorative: callers give the text to screen readers some other way. */
export function RansomText({ text, className = "" }: { text: string; className?: string }) {
  let index = 0;
  return (
    <span aria-hidden="true" className={`flex flex-wrap items-center gap-x-[0.45em] gap-y-2 ${className}`}>
      {text.split(" ").map((word, wordIndex) => (
        <span key={wordIndex} className="flex items-center gap-[0.06em]">
          {[...word].map((letter) => {
            index += 1;
            return <Cutout key={index} letter={letter} index={index} />;
          })}
        </span>
      ))}
    </span>
  );
}
