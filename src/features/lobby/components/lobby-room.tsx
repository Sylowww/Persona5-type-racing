"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import { canStartRace, countReady } from "@/lib/lobby";
import type { LobbyView } from "@/types/lobby";
import {
  addLobbyBot,
  leaveLobby,
  removeLobbyBot,
  sendLobbyMessage,
  setLobbyReady,
  startLobbyRace,
  updateLobbySettings,
} from "../actions";
import { useLobbyStream } from "../use-lobby-stream";
import { LobbyActions } from "./lobby-actions";
import { LobbyHeader } from "./lobby-header";
import { LobbyRoster } from "./lobby-roster";
import { RulesDossier } from "./rules-dossier";
import { TauntFeed } from "./taunt-feed";

type LobbyRoomProps = {
  dictionary: Dictionary["lobby"];
  locale: Locale;
  initialView: LobbyView;
};

/** The live lobby: roster and readiness stay in sync through the lobby stream. */
export function LobbyRoom({ dictionary, locale, initialView }: LobbyRoomProps) {
  const router = useRouter();
  const { view, status } = useLobbyStream(initialView);
  const [isPending, startTransition] = useTransition();
  const { code } = view;

  // Everyone moves to the race together when the host starts it.
  useEffect(() => {
    if (status === "closed") router.replace(`/${locale}`);
    else if ((view.phase === "countdown" || view.phase === "racing") && view.race?.you) router.push(`/${locale}/lobby/${code}/race`);
  }, [status, view, code, locale, router]);

  const you = view.players.find((player) => player.id === view.youId);
  const isHost = you?.isHost ?? false;
  const isReady = you?.isReady ?? false;
  const { players } = view;
  const isWaiting = view.phase === "waiting" || view.phase === "finished";

  return (
    <>
      <LobbyHeader
        dictionary={dictionary.header}
        code={code}
        playerCount={players.length}
        capacity={view.capacity}
        readyCount={countReady(players)}
      />

      <div className="grid grid-cols-1 items-start gap-7 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <LobbyRoster
            dictionary={dictionary}
            code={code}
            capacity={view.capacity}
            players={players}
            youId={view.youId}
            canManageBots={isHost && view.phase !== "countdown" && view.phase !== "racing"}
            isPending={isPending}
            onAddBot={(difficulty) => startTransition(async () => void (await addLobbyBot(code, difficulty)))}
            onRemoveBot={(botId) => startTransition(async () => void (await removeLobbyBot(code, botId)))}
          />
        </div>
        <div className="flex flex-col gap-4 xl:col-span-4">
          <RulesDossier
            dictionary={dictionary.rules}
            settings={view.settings}
            canEdit={isHost && isWaiting}
            isPending={isPending}
            onChange={(change) => startTransition(async () => void (await updateLobbySettings(code, change)))}
            spectators={[]}
          />
          <TauntFeed dictionary={dictionary.chat} messages={view.messages} youId={view.youId} onSend={(text) => sendLobbyMessage(code, text)} />
        </div>
      </div>

      <LobbyActions
        dictionary={dictionary.actions}
        canStart={isHost && view.phase === "waiting" && canStartRace(players)}
        isHost={isHost}
        isReady={isReady}
        isPending={isPending}
        onToggleReady={() => startTransition(async () => void (await setLobbyReady(code, !isReady)))}
        onStart={() => startTransition(async () => void (await startLobbyRace(code)))}
        onLeave={() => startTransition(() => leaveLobby(code, locale))}
        onShowSettings={() => focusSection("lobby-rules")}
        onShowChat={() => focusSection("lobby-chat-input")}
      />
    </>
  );
}

function focusSection(id: string) {
  const element = document.getElementById(id);
  element?.scrollIntoView({ behavior: "smooth", block: "center" });
  element?.focus({ preventScroll: true });
}
