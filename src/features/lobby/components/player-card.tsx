import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { characterPortrait } from "@/lib/characters";
import { botTargetWpm } from "@/lib/lobby";
import type { LobbyMember } from "@/types/lobby";

type PlayerCardProps = {
  dictionary: Dictionary["lobby"]["roster"];
  botDictionary: Dictionary["lobby"]["bots"];
  player: LobbyMember;
  slot: number;
  isYou: boolean;
  /** Set when the viewer (host) may remove this bot or kick this player. */
  onRemove: (() => void) | null;
  isPending: boolean;
};

// Level, title and best speed come later with persistent stats. Bots show their difficulty and target speed.
export function PlayerCard({ dictionary, botDictionary, player, slot, isYou, onRemove, isPending }: PlayerCardProps) {
  const presence = player.bot
    ? botDictionary.difficulties[player.bot]
    : !player.isConnected
      ? dictionary.reconnecting
      : isYou
        ? dictionary.you
        : dictionary.online;
  const portrait = characterPortrait(player.character);

  return (
    <li className="group relative h-[290px]">
      <article
        className={`relative flex h-full flex-col justify-between overflow-hidden border border-surface-container-high border-t-4 bg-surface-container-low p-4 ${
          player.isReady ? "border-t-secondary-fixed" : "border-t-surface-container-highest"
        }`}
      >
        {/* The chosen character's portrait fills the card; dark fades keep the name and speed readable. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Image
            src={portrait}
            alt=""
            fill
            sizes="(min-width: 1280px) 320px, 50vw"
            className="object-cover object-top opacity-80 transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-surface-container-lowest/90 via-transparent via-40% to-surface-container-lowest/95" />
        </div>
        <header className="z-10 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <span className={`font-hud text-[11px] font-black uppercase tracking-widest ${player.isHost ? "text-secondary-fixed" : "text-on-surface-variant"}`}>
              {formatMessage(player.isHost ? dictionary.host : player.bot ? botDictionary.slot : dictionary.player, { slot })}
            </span>
            <h3 className="mt-1 truncate font-display text-headline-sm uppercase italic tracking-wide text-secondary">{player.name}</h3>
            <span className={`font-hud text-[11px] font-black uppercase tracking-wider ${player.isConnected ? "text-on-surface-variant" : "text-error"}`}>
              {presence}
            </span>
          </div>
          <span
            className={`shrink-0 px-2 py-0.5 font-hud text-label-hud font-black uppercase tracking-wider ${
              player.isReady ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-surface-container-lowest/90 text-on-surface-variant"
            }`}
          >
            {player.isReady ? dictionary.ready : dictionary.waiting}
          </span>
        </header>

        <div className="z-10 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            <span className="font-hud text-[11px] font-black uppercase tracking-widest text-on-surface-variant">
              {player.bot ? botDictionary.targetWpm : dictionary.bestWpm}
            </span>
            <span className="font-display text-headline-md italic leading-none text-secondary">
              {player.bot ? formatMessage(dictionary.wpm, { wpm: botTargetWpm[player.bot] }) : dictionary.noRecord}
            </span>
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              disabled={isPending}
              aria-label={formatMessage(player.bot ? botDictionary.remove : dictionary.kick, { name: player.name })}
              title={formatMessage(player.bot ? botDictionary.remove : dictionary.kick, { name: player.name })}
              className="flex size-9 shrink-0 items-center justify-center bg-surface-container-lowest/90 text-on-surface transition-colors hover:bg-error-container hover:text-on-error-container disabled:opacity-60"
            >
              <Icon name="close" size={20} />
            </button>
          )}
        </div>
      </article>
    </li>
  );
}
