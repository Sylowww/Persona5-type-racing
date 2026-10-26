import { Fragment } from "react";

type BandProps = { phrases: readonly string[]; className: string; reverse?: boolean };

/** One endless band of phrases; the strip holds two copies so the loop has no seam. */
function Band({ phrases, className, reverse = false }: BandProps) {
  const copy = (
    <span className="flex shrink-0 items-center gap-8 pr-8">
      {phrases.map((phrase) => (
        <Fragment key={phrase}>
          <span>{phrase}</span>
          <span className="text-[0.6em]">✦</span>
        </Fragment>
      ))}
    </span>
  );

  return (
    <div className={`overflow-clip py-2 font-display text-[clamp(28px,3.5vw,52px)] uppercase italic leading-tight whitespace-nowrap ${className}`}>
      <div className={`marquee-strip flex w-max ${reverse ? "marquee-strip-reverse" : ""}`}>
        {copy}
        {copy}
      </div>
    </div>
  );
}

/** Two crossing bands of slogans between the menu and the rest of the home page. Decorative. */
export function PhantomMarquee({ phrases }: { phrases: readonly string[] }) {
  return (
    <div aria-hidden="true" className="relative my-6 h-40 overflow-clip md:h-48">
      <Band phrases={phrases} reverse className="absolute inset-x-[-5%] top-1/2 -translate-y-1/2 rotate-[3deg] border-y-2 border-primary-container bg-surface-container-lowest text-primary-container" />
      <Band phrases={phrases} className="absolute inset-x-[-5%] top-1/2 -translate-y-1/2 -rotate-[3deg] bg-primary-container text-surface-container-lowest shadow-hard-lg" />
    </div>
  );
}
