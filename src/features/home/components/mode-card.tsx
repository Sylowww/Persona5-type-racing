import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";

export type ModeCardVariant = "blitz" | "browse" | "training";

type ModeCardProps = {
  variant: ModeCardVariant;
  badge: string;
  title: string;
  description: string;
  action: string;
  /** A page to open, or a Server Function to run when the card is clicked. */
  target: { href: string } | { run: () => Promise<void> };
};

const icons: Record<ModeCardVariant, IconName> = {
  blitz: "swords",
  browse: "theater_comedy",
  training: "model_training",
};

export function ModeCard({ variant, badge, title, description, action, target }: ModeCardProps) {
  return (
    <article className="group panel relative flex h-full flex-col gap-3 p-5 transition-colors hover:border-primary-container hover:bg-surface-container">
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow">{badge}</span>
        <Icon name={icons[variant]} size={22} className="text-primary-container" />
      </div>
      <h2 className="font-display text-headline-sm uppercase italic tracking-wide text-secondary md:text-headline-md">{title}</h2>
      <p className="line-clamp-2 text-body-md text-on-surface-variant">{description}</p>
      <span className="mt-auto flex items-center gap-1 pt-2 font-hud text-label-hud font-black uppercase tracking-widest text-secondary transition-colors group-hover:text-secondary-fixed">
        {action}
        <Icon name="arrow_forward" size={16} className="transition-transform group-hover:translate-x-1" />
      </span>
      <CardTarget target={target} label={`${title} - ${action}`} />
    </article>
  );
}

/** Covers the whole card, so a click anywhere opens the page or runs the Server Function. */
function CardTarget({ target, label }: { target: ModeCardProps["target"]; label: string }) {
  const className = "absolute inset-0 z-10 cursor-pointer";
  if ("href" in target) return <Link href={target.href} aria-label={label} className={className} />;
  return (
    <form action={target.run}>
      <button type="submit" aria-label={label} className={className} />
    </form>
  );
}
