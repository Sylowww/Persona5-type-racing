"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import { canStartRace, countReady, MAX_LOBBY_CAPACITY, MIN_LOBBY_CAPACITY } from "@/lib/lobby";
import type { LobbyView } from "@/types/lobby";
import {
  addLobbyBot,
  createLobbyInvite,
  kickLobbyMember,
  leaveLobby,
  removeLobbyBot,
  sendLobbyMessage,
  setLobbyCapacity,
  setLobbyReady,
  setLobbyRole,
  setLobbyVisibility,
  startLobbyRace,
  updateLobbySettings,
} from "../actions";
import { useLobbyStream } from "../use-lobby-stream";
import { InvitePanel } from "./invite-panel";
import { LobbyActions } from "./lobby-actions";
import { LobbyHeader } from "./lobby-header";
import { LobbyRoster } from "./lobby-roster";
import { RulesDossier } from "./rules-dossier";
import { RulesSummary } from "./rules-summary";
import { SettingsPanel } from "./settings-panel";
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { code } = view;

  // Everyone moves to the race together when the host starts it.
  useEffect(() => {
    if (status === "closed") router.replace(`/${locale}`);
    // Spectators follow the race on the track too.
    else if ((view.phase === "countdown" || view.phase === "racing") && view.race) router.push(`/${locale}/lobby/${code}/race`);
  }, [status, view, code, locale, router]);

  const you = view.players.find((player) => player.id === view.youId);
  const isHost = you?.isHost ?? false;
  const isReady = you?.isReady ?? false;
  const isSpectator = you?.isSpectator ?? false;
  // Spectators take no seat and do not race.
  const players = view.players.filter((player) => !player.isSpectator);
  const spectators = view.players.filter((player) => player.isSpectator);
  const isWaiting = view.phase === "waiting" || view.phase === "finished";
  // Training is solo: no bots, and the player starts without readying up.
  const isTraining = view.kind === "training";
  const canEditRules = isHost && isWaiting;
  const visibility = view.kind === "custom" ? view.visibility : null;
  const seats = view.kind === "custom" ? { capacity: view.capacity, min: Math.max(MIN_LOBBY_CAPACITY, players.length), max: MAX_LOBBY_CAPACITY } : null;

  return (
    <>
      <LobbyHeader
        dictionary={dictionary.header}
        code={code}
        playerCount={players.length}
        capacity={view.capacity}
        readyCount={countReady(players)}
      />

      {/* Right under the header, so readying up and starting never need a scroll. */}
      <LobbyActions
        dictionary={dictionary.actions}
        canStart={isHost && isWaiting && (isTraining || canStartRace(players))}
        isHost={isHost}
        isReady={isReady}
        isSpectator={isSpectator}
        onToggleRole={
          view.kind === "custom" && isWaiting
            ? () => startTransition(async () => void (await setLobbyRole(code, isSpectator ? "player" : "spectator")))
            : null
        }
        isPending={isPending}
        onToggleReady={() => startTransition(async () => void (await setLobbyReady(code, !isReady)))}
        onStart={() => startTransition(async () => void (await startLobbyRace(code)))}
        onLeave={() => startTransition(() => leaveLobby(code, locale))}
        onShowSettings={() => setSettingsOpen(true)}
        onShowChat={() => focusSection("lobby-chat-input")}
        close={isHost && isWaiting && view.kind === "custom" ? { code, locale } : null}
      />

      <div className="grid grid-cols-1 items-start gap-7 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <LobbyRoster
            dictionary={dictionary}
            code={code}
            capacity={view.capacity}
            players={players}
            spectators={spectators}
            youId={view.youId}
            canManageBots={isHost && !isTraining && view.phase !== "countdown" && view.phase !== "racing"}
            isPending={isPending}
            onAddBot={(difficulty) => startTransition(async () => void (await addLobbyBot(code, difficulty)))}
            onRemoveBot={(botId) => startTransition(async () => void (await removeLobbyBot(code, botId)))}
            onKick={isHost && view.kind === "custom" ? (playerId) => startTransition(async () => void (await kickLobbyMember(code, playerId))) : null}
          />
        </div>
        <div className="flex flex-col gap-4 xl:col-span-4">
          {view.invites && (
            <InvitePanel
              dictionary={dictionary.invites}
              locale={locale}
              invites={view.invites}
              isPending={isPending}
              onCreate={() => startTransition(async () => void (await createLobbyInvite(code)))}
            />
          )}
          <RulesSummary
            dictionary={dictionary.rules}
            settings={view.settings}
            visibility={visibility}
            canEdit={canEditRules}
            onOpen={() => setSettingsOpen(true)}
          />
          <TauntFeed dictionary={dictionary.chat} messages={view.messages} youId={view.youId} onSend={(text) => sendLobbyMessage(code, text)} />
        </div>
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} label={dictionary.rules.title}>
        <RulesDossier
          dictionary={dictionary.rules}
          settings={view.settings}
          canEdit={canEditRules}
          isPending={isPending}
          onChange={(change) => startTransition(async () => void (await updateLobbySettings(code, change)))}
          visibility={visibility}
          onVisibilityChange={(visibility) => startTransition(async () => void (await setLobbyVisibility(code, visibility)))}
          seats={seats}
          onCapacityChange={(capacity) => startTransition(async () => void (await setLobbyCapacity(code, capacity)))}
          spectators={spectators.map((spectator) => spectator.name)}
          onClose={() => setSettingsOpen(false)}
        />
      </SettingsPanel>
    </>
  );
}

function focusSection(id: string) {
  const element = document.getElementById(id);
  element?.scrollIntoView({ behavior: "smooth", block: "center" });
  element?.focus({ preventScroll: true });
}
