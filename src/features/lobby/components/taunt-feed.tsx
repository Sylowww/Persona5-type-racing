import type { Dictionary } from "@/i18n/dictionaries/en";
import type { LobbyMessage } from "@/types/lobby";

type TauntFeedProps = {
  dictionary: Dictionary["lobby"]["chat"];
  messages: readonly LobbyMessage[];
  currentPlayer: string;
};

export function TauntFeed({ dictionary, messages, currentPlayer }: TauntFeedProps) {
  return (
    <section className="flex flex-col gap-2 bg-surface-container-low p-2">
      <div className="flex items-center justify-between font-hud text-[11px] font-black uppercase text-outline">
        <h2>{dictionary.title}</h2>
        <span className="text-secondary-fixed">{dictionary.live}</span>
      </div>
      <ul className="flex flex-col gap-1 text-[13px]">
        {messages.map((message) => (
          <li key={message.id}>
            <span className={`font-bold ${message.author === currentPlayer ? "text-secondary-fixed" : "text-primary"}`}>
              {message.author}:
            </span>{" "}
            {message.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
