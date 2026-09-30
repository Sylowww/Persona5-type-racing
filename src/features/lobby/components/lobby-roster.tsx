import { Icon } from "@/components/ui/icon";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { openSlotCount } from "@/lib/lobby";
import type { Lobby } from "@/types/lobby";
import { AddBotCard } from "./add-bot-card";
import { EmptySlotCard } from "./empty-slot-card";
import { PlayerCard } from "./player-card";

type LobbyRosterProps = {
  dictionary: Dictionary["lobby"];
  lobby: Lobby;
};

export function LobbyRoster({ dictionary, lobby }: LobbyRosterProps) {
  const { roster } = dictionary;
  const openSlots = openSlotCount(lobby.players.length, lobby.capacity);
  // The last free seat offers a bot; the others invite players.
  const inviteSlots = Math.max(0, openSlots - 1);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="inline-flex w-fit -skew-x-12 items-center gap-2 bg-surface-container px-4 py-1">
        <Icon name="sports_martial_arts" size={18} className="text-primary-container" />
        <span className="font-hud text-label-hud font-black uppercase tracking-widest text-secondary">{roster.title}</span>
      </h2>

      <ol className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lobby.players.map((player, index) => (
          <PlayerCard key={player.id} dictionary={roster} player={player} slot={index + 1} />
        ))}
        {Array.from({ length: inviteSlots }, (_, index) => {
          const slot = lobby.players.length + index + 1;
          return <EmptySlotCard key={slot} dictionary={roster} slot={slot} code={lobby.code} />;
        })}
        {openSlots > 0 && <AddBotCard dictionary={dictionary.bots} wpmLabel={roster.wpm} />}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-container-lowest px-4 py-2 text-on-surface-variant">
        <div className="flex items-center gap-2">
          <Icon name="electric_bolt" size={18} className="text-secondary-fixed" />
          <span className="font-hud text-label-hud font-black uppercase tracking-widest">{dictionary.ticker.bonus}</span>
        </div>
        <span className="font-hud text-[11px] font-black uppercase tracking-wider text-outline">{dictionary.ticker.start}</span>
      </div>
    </section>
  );
}
