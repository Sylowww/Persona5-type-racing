import { Icon } from "@/components/ui/icon";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { openSlotCount } from "@/lib/lobby";
import type { BotDifficulty, LobbyMember } from "@/types/lobby";
import { AddBotCard } from "./add-bot-card";
import { EmptySlotCard } from "./empty-slot-card";
import { PlayerCard } from "./player-card";

type LobbyRosterProps = {
  dictionary: Dictionary["lobby"];
  code: string;
  capacity: number;
  players: readonly LobbyMember[];
  youId: string;
  /** The viewer is host and the lobby is not racing. */
  canManageBots: boolean;
  isPending: boolean;
  onAddBot: (difficulty: BotDifficulty) => void;
  onRemoveBot: (botId: string) => void;
};

export function LobbyRoster({
  dictionary,
  code,
  capacity,
  players,
  youId,
  canManageBots,
  isPending,
  onAddBot,
  onRemoveBot,
}: LobbyRosterProps) {
  const { roster } = dictionary;
  const openSlots = openSlotCount(players.length, capacity);
  // Lobbies hold a whole class, so free seats collapse into one invite card, plus the host's bot card.
  const inviteSlots = Math.min(1, Math.max(0, canManageBots ? openSlots - 1 : openSlots));

  return (
    <section className="flex flex-col gap-4">
      <h2 className="inline-flex w-fit -skew-x-12 items-center gap-2 bg-surface-container px-4 py-1">
        <Icon name="sports_martial_arts" size={18} className="text-primary-container" />
        <span className="font-hud text-label-hud font-black uppercase tracking-widest text-secondary">{roster.title}</span>
      </h2>

      <ol className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {players.map((player, index) => (
          <PlayerCard
            key={player.id}
            dictionary={roster}
            botDictionary={dictionary.bots}
            player={player}
            slot={index + 1}
            isYou={player.id === youId}
            onRemove={canManageBots && player.bot !== null ? () => onRemoveBot(player.id) : null}
            isPending={isPending}
          />
        ))}
        {Array.from({ length: inviteSlots }, (_, index) => {
          const slot = players.length + index + 1;
          return <EmptySlotCard key={slot} dictionary={roster} slot={slot} code={code} />;
        })}
        {canManageBots && openSlots > 0 && (
          <AddBotCard dictionary={dictionary.bots} wpmLabel={roster.wpm} isPending={isPending} onAdd={onAddBot} />
        )}
      </ol>

      <div className="flex items-center justify-end gap-2 bg-surface-container-lowest px-4 py-2 text-on-surface-variant">
        <span className="font-hud text-[11px] font-black uppercase tracking-wider text-outline">{dictionary.ticker.start}</span>
      </div>
    </section>
  );
}
