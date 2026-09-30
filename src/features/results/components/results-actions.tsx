import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { Dictionary } from "@/i18n/dictionaries/en";

type ResultsActionsProps = {
  dictionary: Dictionary["results"]["actions"];
  lobbyHref: string;
};

/** Both lead back to the lobby: a rematch starts once everyone is ready again. */
export function ResultsActions({ dictionary, lobbyHref }: ResultsActionsProps) {
  return (
    <div className="flex flex-col items-stretch justify-between gap-6 bg-surface-container-low p-4 shadow-hard-xl md:flex-row md:items-center">
      <Link
        href={lobbyHref}
        className="flex -skew-x-6 items-center justify-center gap-2 bg-surface-container px-4 py-2 font-hud text-headline-sm font-black uppercase italic text-secondary shadow-hard-sm transition-transform hover:-translate-y-0.5 hover:bg-surface-container-high"
      >
        <Icon name="home" size={20} />
        {dictionary.lobby}
      </Link>

      <Link
        href={lobbyHref}
        className="group -skew-x-12 bg-primary-container px-12 py-4 text-on-primary-container shadow-[8px_8px_0_var(--color-secondary-fixed)] transition-transform duration-200 hover:-translate-y-1"
      >
        <span className="flex skew-x-12 items-center justify-center gap-4">
          <Icon name="bolt" size={32} filled className="group-hover:motion-safe:animate-bounce" />
          <span className="flex flex-col text-left">
            <span className="font-hud text-[11px] font-black uppercase leading-none tracking-widest text-secondary-fixed">
              {dictionary.eyebrow}
            </span>
            <span className="mt-1 font-display text-headline-md uppercase italic leading-none tracking-wider text-secondary md:text-headline-lg">
              {dictionary.rematch}
            </span>
          </span>
        </span>
      </Link>
    </div>
  );
}
