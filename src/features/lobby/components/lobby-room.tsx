"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import { canStartRace, countReady, currentRaceSettings } from "@/lib/lobby";
import type { LobbyView } from "@/types/lobby";
import { leaveLobby, setLobbyReady, startLobbyRace } from "../actions";
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
          <LobbyRoster dictionary={dictionary} code={code} capacity={view.capacity} players={players} youId={view.youId} />
        </div>
        <div className="flex flex-col gap-4 xl:col-span-4">
          <RulesDossier dictionary={dictionary.rules} settings={currentRaceSettings(view.locale)} spectators={[]} />
          <TauntFeed dictionary={dictionary.chat} messages={[]} currentPlayer={you?.name ?? ""} />
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
      />
    </>
  );
}
