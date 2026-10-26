import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { CloseLobbyButton } from "@/features/lobby/components/close-lobby-button";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";

type ResultsActionsProps = {
  dictionary: Dictionary["results"]["actions"];
  lobbyHref: string;
  /** Set for the host of a custom lobby (COURSE-11): they may also close it. */
  close: { code: string; locale: Locale; label: string; confirmMessage: string } | null;
};

/** Both links lead back to the lobby: a rematch starts once everyone is ready again. The host may close it instead. */
export function ResultsActions({ dictionary, lobbyHref, close }: ResultsActionsProps) {
  return (
    <div className="flex flex-col items-stretch justify-between gap-6 border-y border-surface-container-high py-6 md:flex-row md:items-center">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={lobbyHref} className="btn-ghost">
          <Icon name="home" size={18} />
          {dictionary.lobby}
        </Link>
        {close && <CloseLobbyButton {...close} />}
      </div>

      <Link
        href={lobbyHref}
        className="flex items-center justify-center gap-4 bg-primary-container px-10 py-4 text-on-primary-container shadow-hard-xl transition-transform hover:-translate-y-1"
      >
        <Icon name="bolt" size={32} filled />
        <span className="flex flex-col text-left">
          <span className="font-hud text-[11px] font-black uppercase leading-none tracking-widest">{dictionary.eyebrow}</span>
          <span className="mt-1 font-display text-headline-md uppercase italic leading-none tracking-wider">{dictionary.rematch}</span>
        </span>
      </Link>
    </div>
  );
}
