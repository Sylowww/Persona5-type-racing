import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { openSlotCount } from "@/lib/lobby";
import type { CharacterId } from "@/types/character";
import type { BotDifficulty, LobbyMember } from "@/types/lobby";
import { AddBotCard } from "./add-bot-card";
import { EmptySlotCard } from "./empty-slot-card";
import { PlayerCard } from "./player-card";

type LobbyRosterProps = {
  dictionary: Dictionary["lobby"];
  code: string;
  capacity: number;
  players: readonly LobbyMember[];
  spectators: readonly LobbyMember[];
  youId: string;
  /** The viewer is host and the lobby is not racing. */
  canManageBots: boolean;
  isPending: boolean;
  onAddBot: (difficulty: BotDifficulty, character: CharacterId | null) => void;
  characterNames: Record<CharacterId, string>;
  onRemoveBot: (botId: string) => void;
  /** Set when the viewer is host: removes another player for good. */
  onKick: ((playerId: string) => void) | null;
};

export function LobbyRoster({
  dictionary,
  code,
  capacity,
  players,
  spectators,
  youId,
  canManageBots,
  isPending,
  onAddBot,
  characterNames,
  onRemoveBot,
  onKick,
}: LobbyRosterProps) {
  const { roster } = dictionary;
  const openSlots = openSlotCount(players.length, capacity);
  // Lobbies hold a whole class, so free seats collapse into one invite card, plus the host's bot card.
  const inviteSlots = Math.min(1, Math.max(0, canManageBots ? openSlots - 1 : openSlots));

  return (
    <section className="flex flex-col gap-4">
      <h2 className="eyebrow">{roster.title}</h2>

      <ol className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {players.map((player, index) => (
          <PlayerCard
            key={player.id}
            dictionary={roster}
            botDictionary={dictionary.bots}
            player={player}
            slot={index + 1}
            isYou={player.id === youId}
            onRemove={
              player.bot !== null
                ? canManageBots
                  ? () => onRemoveBot(player.id)
                  : null
                : onKick && player.id !== youId
                  ? () => onKick(player.id)
                  : null
            }
            isPending={isPending}
          />
        ))}
        {Array.from({ length: inviteSlots }, (_, index) => {
          const slot = players.length + index + 1;
          return <EmptySlotCard key={slot} dictionary={roster} slot={slot} code={code} />;
        })}
        {canManageBots && openSlots > 0 && (
          <AddBotCard dictionary={dictionary.bots} characterNames={characterNames} wpmLabel={roster.wpm} isPending={isPending} onAdd={onAddBot} />
        )}
      </ol>

      {spectators.length > 0 && (
        <div className="panel flex flex-col gap-3 p-4">
          <h3 className="flex items-center gap-2 font-hud text-label-hud font-black uppercase tracking-widest text-secondary-fixed">
            <Icon name="visibility" size={16} />
            {roster.spectators}
          </h3>
          <ul className="flex flex-wrap gap-2">
            {spectators.map((spectator) => (
              <li key={spectator.id} className="flex items-center gap-1 border border-surface-container-high px-2 py-1">
                <span className="font-body text-body-md font-bold text-secondary">
                  {spectator.name}
                  {spectator.isHost && <span className="ml-1 font-hud text-[11px] uppercase text-secondary-fixed">{roster.hostTag}</span>}
                </span>
                {onKick && spectator.id !== youId && (
                  <button
                    type="button"
                    onClick={() => onKick(spectator.id)}
                    disabled={isPending}
                    aria-label={formatMessage(roster.kick, { name: spectator.name })}
                    title={formatMessage(roster.kick, { name: spectator.name })}
                    className="flex size-6 items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
                  >
                    <Icon name="close" size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-right font-hud text-[11px] font-black uppercase tracking-wider text-on-surface-variant">{dictionary.ticker.start}</p>
    </section>
  );
}
