import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { LobbyMember } from "@/types/lobby";
import { PlayerEmblem } from "./player-emblem";

type PlayerCardProps = {
  dictionary: Dictionary["lobby"]["roster"];
  player: LobbyMember;
  slot: number;
  isYou: boolean;
};

// Level, title and best speed come later with persistent stats.
export function PlayerCard({ dictionary, player, slot, isYou }: PlayerCardProps) {
  const presence = !player.isConnected ? dictionary.reconnecting : isYou ? dictionary.you : dictionary.online;
  const tilt = slot % 2 === 0 ? "rotate-1" : "-rotate-1";
  const backing = !player.isReady
    ? "bg-error-container"
    : player.isHost
      ? "bg-primary-container"
      : "bg-surface-container-highest";

  return (
    <li className="group relative h-[290px] transition-transform duration-200 hover:-translate-y-1">
      <div aria-hidden="true" className={`absolute inset-0 translate-x-1 translate-y-1 shadow-hard-lg ${tilt} ${backing}`} />
      <article className="relative flex h-full flex-col justify-between overflow-hidden bg-surface-container-low p-4">
        <header className="z-10 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <span
              className={`w-fit px-2 py-0.5 font-display text-[14px] uppercase italic tracking-wider ${
                player.isHost ? "bg-secondary-fixed text-on-secondary-fixed shadow-hard-xs" : "bg-surface-bright text-secondary"
              }`}
            >
              {formatMessage(player.isHost ? dictionary.host : dictionary.player, { slot })}
            </span>
            <h3 className="mt-1 truncate font-hud text-headline-sm font-black uppercase italic text-secondary">{player.name}</h3>
            <span
              className={`font-hud text-[11px] font-black uppercase ${player.isConnected ? "text-secondary-fixed" : "text-error"}`}
            >
              {presence}
            </span>
          </div>
          <span
            className={`shrink-0 px-3 py-1 font-hud text-[16px] font-black uppercase italic tracking-wider ${
              player.isReady
                ? "rotate-6 bg-secondary-fixed text-on-secondary-fixed shadow-hard-sm shadow-primary-container"
                : "rotate-3 bg-error-container text-on-error-container shadow-hard-xs motion-safe:animate-pulse"
            }`}
          >
            {player.isReady ? dictionary.ready : dictionary.waiting}
          </span>
        </header>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-2 bottom-6 size-36 opacity-70 transition-transform duration-300 group-hover:scale-105"
        >
          <PlayerEmblem emblem={player.emblem} />
        </div>

        <div className="z-10 w-3/4 -skew-x-6 bg-surface-container-lowest/90 p-2 backdrop-blur-sm">
          <div className="flex skew-x-6 items-baseline justify-between gap-2">
            <span className="font-hud text-[11px] font-black uppercase text-on-surface-variant">{dictionary.bestWpm}</span>
            <span
              className={`font-display text-headline-md italic leading-none ${player.isHost ? "text-primary-container" : "text-secondary"}`}
            >
              {dictionary.noRecord}
            </span>
          </div>
        </div>
      </article>
    </li>
  );
}
