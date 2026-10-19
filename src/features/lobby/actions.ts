"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";
import { isBotDifficulty } from "@/lib/bots";
import { clientIp } from "@/lib/client-ip";
import { normalizeLobbyCode } from "@/lib/lobby-code";
import { lobbyCodeLimiter } from "@/lib/lobby-join-limit";
import { getLobbyStore } from "@/lib/lobby-server";
import type { QuickMatchStatus, StoreError } from "@/lib/lobby-store";
import { botForSpeed } from "@/lib/matchmaking";
import { getPlayerStats } from "@/lib/race-history-db";

export type JoinErrorCode =
  | "invalidCode"
  | "lobbyNotFound"
  | "lobbyFull"
  | "privateLobby"
  | "raceInProgress"
  | "kicked"
  | "tooManyAttempts";

export type InviteErrorCode = "invalidInvite" | "inviteUsed" | "lobbyFull" | "raceInProgress" | "kicked";

export type JoinFormState = { error: JoinErrorCode | null; code: string };

function toLocale(value: unknown): Locale {
  return typeof value === "string" && isLocale(value) ? value : "fr";
}

/** The current player (guest or registered); without a session, a redirect to pick a guest nickname, then to `next`. */
async function requirePlayer(locale: Locale, next: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/guest?next=${encodeURIComponent(next)}`);
  return { id: user.id, name: user.username, character: user.character };
}

/** Only registered players open lobbies (AUTH-03); guests and visitors are sent to create an account. */
async function requireHost(locale: Locale) {
  const user = await getCurrentUser();
  if (user?.kind !== "registered") redirect(`/${locale}/sign-up?reason=host`);
  return { id: user.id, name: user.username, character: user.character };
}

export async function createLobby(localeValue: string): Promise<void> {
  const locale = toLocale(localeValue);
  const player = await requireHost(locale);
  const code = getLobbyStore().create(player, locale);
  redirect(`/${locale}/lobby/${code}`);
}

export async function joinLobby(_previous: JoinFormState, form: FormData): Promise<JoinFormState> {
  const locale = toLocale(form.get("locale"));
  const raw = form.get("code");
  const typed = typeof raw === "string" ? raw.slice(0, 16) : "";
  const code = normalizeLobbyCode(typed);
  if (!code) return { error: "invalidCode", code: typed };
  if (!lobbyCodeLimiter().allow(clientIp(await headers()))) return { error: "tooManyAttempts", code: typed };

  const player = await requirePlayer(locale, `/${locale}/lobby/${code}`);
  const error = getLobbyStore().join(code, player);
  if (error === "lobbyNotFound" || error === "lobbyFull" || error === "privateLobby" || error === "raceInProgress" || error === "kicked") {
    return { error, code: typed };
  }
  if (error) return { error: "lobbyNotFound", code: typed };
  redirect(`/${locale}/lobby/${code}`);
}

/** Training dojo: a solo practice race that starts right away (never saved). It opens a lobby, so registered players only. */
export async function startTraining(localeValue: string): Promise<void> {
  const locale = toLocale(localeValue);
  const player = await requireHost(locale);
  const code = getLobbyStore().startTraining(player, locale);
  redirect(`/${locale}/lobby/${code}/race`);
}

/** Quick 1v1: enters matchmaking. The fallback bot matches the player's average speed. */
export async function joinQuickMatch(localeValue: string): Promise<QuickMatchStatus> {
  const locale = toLocale(localeValue);
  const player = await requirePlayer(locale, `/${locale}/quick`);
  const stats = await getPlayerStats(player.id);
  return getLobbyStore().joinQuickMatch(player, locale, botForSpeed(stats.races > 0 ? stats.averageWpm : null));
}

export async function checkQuickMatch(): Promise<QuickMatchStatus> {
  const user = await getCurrentUser();
  return user ? getLobbyStore().quickMatchStatus(user.id) : { state: "idle" };
}

export async function leaveQuickMatch(): Promise<void> {
  const user = await getCurrentUser();
  if (user) getLobbyStore().leaveQuickMatch(user.id);
}

export async function leaveLobby(codeValue: string, localeValue: string): Promise<void> {
  const locale = toLocale(localeValue);
  const code = normalizeLobbyCode(String(codeValue));
  const user = await getCurrentUser();
  if (user && code) getLobbyStore().leave(code, user.id);
  redirect(`/${locale}`);
}

/** Lobby commands return an error code, or null when applied; the new state arrives through the event stream. */
async function lobbyCommand(codeValue: unknown, run: (code: string, userId: string) => StoreError | null): Promise<StoreError | null> {
  const code = normalizeLobbyCode(String(codeValue));
  const user = await getCurrentUser();
  if (!code) return "lobbyNotFound";
  if (!user) return "notMember";
  return run(code, user.id);
}

/** Host only, outside a race: closes the lobby for everyone, then goes home. */
export async function closeLobbyForAll(codeValue: string, localeValue: string): Promise<StoreError | null> {
  const locale = toLocale(localeValue);
  const error = await lobbyCommand(codeValue, (lobby, userId) => getLobbyStore().close(lobby, userId));
  if (error) return error;
  redirect(`/${locale}`);
}

/** Host only: adds an invite link to the lobby; it shows up in the host's next snapshot. */
export async function createLobbyInvite(code: string): Promise<StoreError | null> {
  return lobbyCommand(code, (lobby, userId) => getLobbyStore().createInvite(lobby, userId));
}

/** Joins the lobby of an invite link from this request's IP address (SALLE-04); returns why it failed, or redirects into it. */
export async function joinWithInviteLink(token: string, localeValue: string): Promise<InviteErrorCode> {
  const locale = toLocale(localeValue);
  if (typeof token !== "string" || token.length > 64) return "invalidInvite";
  const player = await requirePlayer(locale, `/${locale}/invite/${encodeURIComponent(token)}`);
  const result = getLobbyStore().joinWithInvite(token, player, clientIp(await headers()));
  if ("code" in result) redirect(`/${locale}/lobby/${result.code}`);
  const { error } = result;
  return error === "inviteUsed" || error === "lobbyFull" || error === "raceInProgress" || error === "kicked" ? error : "invalidInvite";
}

/** Host only: removes a player from the lobby for good. */
export async function kickLobbyMember(code: string, targetId: string): Promise<StoreError | null> {
  if (typeof targetId !== "string") return "notMember";
  return lobbyCommand(code, (lobby, userId) => getLobbyStore().kick(lobby, userId, targetId));
}

export async function setLobbyReady(code: string, isReady: boolean): Promise<StoreError | null> {
  return lobbyCommand(code, (lobby, userId) => getLobbyStore().setReady(lobby, userId, isReady === true));
}

/** Switches the viewer between racing and spectating (custom lobbies, while waiting). */
export async function setLobbyRole(code: string, role: string): Promise<StoreError | null> {
  return lobbyCommand(code, (lobby, userId) => getLobbyStore().setRole(lobby, userId, role));
}

/** The viewer gives up the race in progress (COURSE-07). */
export async function forfeitLobbyRace(code: string): Promise<StoreError | null> {
  return lobbyCommand(code, (lobby, userId) => getLobbyStore().forfeit(lobby, userId));
}

export async function startLobbyRace(code: string): Promise<StoreError | null> {
  return lobbyCommand(code, (lobby, userId) => getLobbyStore().start(lobby, userId));
}

export async function addLobbyBot(code: string, difficulty: string): Promise<StoreError | null> {
  if (!isBotDifficulty(difficulty)) return "wrongPhase";
  return lobbyCommand(code, (lobby, userId) => getLobbyStore().addBot(lobby, userId, difficulty));
}

export async function removeLobbyBot(code: string, botId: string): Promise<StoreError | null> {
  if (typeof botId !== "string") return "notMember";
  return lobbyCommand(code, (lobby, userId) => getLobbyStore().removeBot(lobby, userId, botId));
}

/** Only the host can change the settings; the server validates every field. */
export async function updateLobbySettings(code: string, change: unknown): Promise<StoreError | null> {
  return lobbyCommand(code, (lobby, userId) => getLobbyStore().updateSettings(lobby, userId, change));
}

export async function setLobbyVisibility(code: string, visibility: string): Promise<StoreError | null> {
  return lobbyCommand(code, (lobby, userId) => getLobbyStore().setVisibility(lobby, userId, visibility));
}

/** Only the host changes the number of seats (2 to 30); the server validates the value. */
export async function setLobbyCapacity(code: string, capacity: number): Promise<StoreError | null> {
  return lobbyCommand(code, (lobby, userId) => getLobbyStore().setCapacity(lobby, userId, capacity));
}

/** Joins a lobby picked in the lobby browser; returns why it failed, or redirects into it. */
export async function joinListedLobby(codeValue: string, localeValue: string): Promise<JoinErrorCode> {
  const locale = toLocale(localeValue);
  const code = normalizeLobbyCode(String(codeValue));
  if (!code) return "lobbyNotFound";
  const player = await requirePlayer(locale, `/${locale}/lobby/${code}`);
  const error = getLobbyStore().join(code, player);
  if (error === "lobbyFull" || error === "privateLobby" || error === "raceInProgress" || error === "kicked") return error;
  if (error) return "lobbyNotFound";
  redirect(`/${locale}/lobby/${code}`);
}

export async function sendLobbyMessage(code: string, text: string): Promise<StoreError | null> {
  return lobbyCommand(code, (lobby, userId) => getLobbyStore().sendMessage(lobby, userId, text));
}
