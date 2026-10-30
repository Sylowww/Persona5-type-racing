import type { ReactNode } from "react";

type PageHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
};

/** Top of a content page: a small label, one big headline with the red underline slash, and an optional intro. */
export function PageHeading({ eyebrow, title, children }: PageHeadingProps) {
  return (
    <header className="flex flex-col gap-3">
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="font-display text-headline-md uppercase italic tracking-wider text-secondary md:text-headline-lg">{title}</h1>
      <span aria-hidden="true" className="h-1 w-16 -skew-x-[30deg] bg-primary-container" />
      {children && <div className="max-w-prose text-on-surface-variant">{children}</div>}
    </header>
  );
}
