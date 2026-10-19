"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Locale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";
import { clientIp } from "@/lib/client-ip";
import { lobbyCodeLimiter } from "@/lib/lobby-join-limit";
import { claimLobbySeat, releaseLobbySeat } from "@/lib/lobby-members-db";
import { getLobbyStore } from "@/lib/lobby-server";
import type { QuickMatchStatus, StoreError } from "@/lib/lobby-store";
import { botForSpeed } from "@/lib/matchmaking";
import { getPlayerStats } from "@/lib/race-history-db";
import { botDifficultySchema, inviteTokenSchema, lobbyCodeSchema, localeSchema, memberIdSchema } from "@/lib/schemas";

export type JoinErrorCode =
  | "alreadyInLobby"
  | "invalidCode"
  | "lobbyNotFound"
  | "lobbyFull"
  | "privateLobby"
  | "raceInProgress"
  | "kicked"
  | "tooManyAttempts";

export type InviteErrorCode = "alreadyInLobby" | "invalidInvite" | "inviteUsed" | "lobbyFull" | "raceInProgress" | "kicked";

/** `current`: the lobby the player is already in, when they must first agree to leave it (SALLE-06). */
export type JoinFormState = { error: JoinErrorCode | null; code: string; current?: string };

// Every argument of these Server Functions comes from the client: each one is checked with a schema (TECH-07).

function toLocale(value: unknown): Locale {
  return localeSchema.catch("fr").parse(value);
}

/** The canonical lobby code, or null for anything that is not one. */
function toCode(value: unknown): string | null {
  const result = lobbyCodeSchema.safeParse(value);
  return result.success ? result.data : null;
}

const flagSchema = z.boolean().catch(false);

/** The current player (guest or registered); without a session, a redirect to pick a guest nickname, then to `next`. */
async function requirePlayer(locale: Locale, next: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/guest?next=${encodeURIComponent(next)}`);
  return { id: user.id, name: user.username, character: user.character };
}

/**
 * One lobby per person (SALLE-06), guaranteed by the `lobby_members` primary key: takes the seat in `code`, or returns
 * the lobby the person is already in. With `leaveCurrent`, they leave that lobby first. A seat left behind by a lobby
 * that no longer holds them is freed silently. If the database is unreachable, the store's own rule still applies.
 */
async function takeSeat(userId: string, code: string, leaveCurrent: boolean): Promise<string | null> {
  const current = await claimLobbySeat(userId, code).catch(() => null);
  if (!current) return null;
  const store = getLobbyStore();
  const isStillThere = store.lobbyOf(userId) === current;
  if (isStillThere && !leaveCurrent) return current;
  if (isStillThere) store.leave(current, userId);
  await releaseLobbySeat(userId, current).catch(() => undefined);
  await claimLobbySeat(userId, code).catch(() => null);
  return null;
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
  const code = toCode(typed);
  if (!code) return { error: "invalidCode", code: typed };
  if (!lobbyCodeLimiter().allow(clientIp(await headers()))) return { error: "tooManyAttempts", code: typed };

  const player = await requirePlayer(locale, `/${locale}/lobby/${code}`);
  const precheck = getLobbyStore().joinError(code, player);
  if (precheck) return { error: precheck === "lobbyFull" || precheck === "privateLobby" || precheck === "raceInProgress" || precheck === "kicked" ? precheck : "lobbyNotFound", code: typed };
  const current = await takeSeat(player.id, code, form.get("leaveCurrent") === "1");
  if (current) return { error: "alreadyInLobby", code: typed, current };
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
  const code = toCode(codeValue);
  const user = await getCurrentUser();
  if (user && code) getLobbyStore().leave(code, user.id);
  redirect(`/${locale}`);
}

/** Lobby commands return an error code, or null when applied; the new state arrives through the event stream. */
async function lobbyCommand(codeValue: unknown, run: (code: string, userId: string) => StoreError | null): Promise<StoreError | null> {
  const code = toCode(codeValue);
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
export async function joinWithInviteLink(token: string, localeValue: string, leaveCurrent = false): Promise<InviteErrorCode> {
  const locale = toLocale(localeValue);
  if (!inviteTokenSchema.safeParse(token).success) return "invalidInvite";
  const player = await requirePlayer(locale, `/${locale}/invite/${encodeURIComponent(token)}`);
  const target = getLobbyStore().inviteTarget(token);
  if (target && (await takeSeat(player.id, target.code, flagSchema.parse(leaveCurrent)))) return "alreadyInLobby";
  const result = getLobbyStore().joinWithInvite(token, player, clientIp(await headers()));
  if ("code" in result) redirect(`/${locale}/lobby/${result.code}`);
  const { error } = result;
  return error === "inviteUsed" || error === "lobbyFull" || error === "raceInProgress" || error === "kicked" ? error : "invalidInvite";
}

/** Host only: removes a player from the lobby for good. */
export async function kickLobbyMember(code: string, targetId: string): Promise<StoreError | null> {
  if (!memberIdSchema.safeParse(targetId).success) return "notMember";
  return lobbyCommand(code, (lobby, userId) => getLobbyStore().kick(lobby, userId, targetId));
}

export async function setLobbyReady(code: string, isReady: boolean): Promise<StoreError | null> {
  return lobbyCommand(code, (lobby, userId) => getLobbyStore().setReady(lobby, userId, flagSchema.parse(isReady)));
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
  const level = botDifficultySchema.safeParse(difficulty);
  if (!level.success) return "wrongPhase";
  return lobbyCommand(code, (lobby, userId) => getLobbyStore().addBot(lobby, userId, level.data));
}

export async function removeLobbyBot(code: string, botId: string): Promise<StoreError | null> {
  if (!memberIdSchema.safeParse(botId).success) return "notMember";
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

export type QuickRaceResult = { state: "none"; canCreate: boolean } | { state: "error"; error: JoinErrorCode; current?: string };

/**
 * « Faire une course » (JOIN-03): joins the public lobby closest to full, or reports that none is available. Registered
 * players are then offered to open one; guests only see that nothing is open.
 */
export async function quickRace(localeValue: string, leaveCurrent = false): Promise<QuickRaceResult> {
  const locale = toLocale(localeValue);
  const player = await requirePlayer(locale, `/${locale}/lobbies`);
  const code = getLobbyStore().quickRaceLobby();
  if (!code) return { state: "none", canCreate: (await getCurrentUser())?.kind === "registered" };
  const current = await takeSeat(player.id, code, flagSchema.parse(leaveCurrent));
  if (current) return { state: "error", error: "alreadyInLobby", current };
  const error = getLobbyStore().join(code, player);
  if (error === "lobbyFull" || error === "privateLobby" || error === "raceInProgress" || error === "kicked") return { state: "error", error };
  if (error) return { state: "error", error: "lobbyNotFound" };
  redirect(`/${locale}/lobby/${code}`);
}

/** Opens a public lobby with the default settings for a registered player (offered when no quick race is open). */
export async function createPublicLobby(localeValue: string): Promise<void> {
  const locale = toLocale(localeValue);
  const player = await requireHost(locale);
  const store = getLobbyStore();
  const code = store.create(player, locale);
  store.setVisibility(code, player.id, "public");
  redirect(`/${locale}/lobby/${code}`);
}

/** Joins a lobby picked in the lobby browser; returns why it failed, or redirects into it. */
export async function joinListedLobby(codeValue: string, localeValue: string, leaveCurrent = false): Promise<JoinErrorCode> {
  const locale = toLocale(localeValue);
  const code = toCode(codeValue);
  if (!code) return "lobbyNotFound";
  const player = await requirePlayer(locale, `/${locale}/lobby/${code}`);
  if (await takeSeat(player.id, code, flagSchema.parse(leaveCurrent))) return "alreadyInLobby";
  const error = getLobbyStore().join(code, player);
  if (error === "lobbyFull" || error === "privateLobby" || error === "raceInProgress" || error === "kicked") return error;
  if (error) return "lobbyNotFound";
  redirect(`/${locale}/lobby/${code}`);
}

export async function sendLobbyMessage(code: string, text: string): Promise<StoreError | null> {
  return lobbyCommand(code, (lobby, userId) => getLobbyStore().sendMessage(lobby, userId, text));
}
