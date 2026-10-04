"use server";

import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";
import { isBotDifficulty } from "@/lib/bots";
import { normalizeLobbyCode } from "@/lib/lobby-code";
import { getLobbyStore } from "@/lib/lobby-server";
import type { StoreError } from "@/lib/lobby-store";

export type JoinErrorCode = "invalidCode" | "lobbyNotFound" | "lobbyFull" | "raceInProgress";

export type JoinFormState = { error: JoinErrorCode | null; code: string };

function toLocale(value: unknown): Locale {
  return typeof value === "string" && isLocale(value) ? value : "fr";
}

/** The signed-in player, or a redirect to sign in. Guests will be allowed once guest sessions exist. */
async function requirePlayer(locale: Locale) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/sign-in`);
  return { id: user.id, name: user.username, character: user.character };
}

export async function createLobby(localeValue: string): Promise<void> {
  const locale = toLocale(localeValue);
  const player = await requirePlayer(locale);
  const code = getLobbyStore().create(player, locale);
  redirect(`/${locale}/lobby/${code}`);
}

export async function joinLobby(_previous: JoinFormState, form: FormData): Promise<JoinFormState> {
  const locale = toLocale(form.get("locale"));
  const raw = form.get("code");
  const typed = typeof raw === "string" ? raw.slice(0, 16) : "";
  const code = normalizeLobbyCode(typed);
  if (!code) return { error: "invalidCode", code: typed };

  const player = await requirePlayer(locale);
  const error = getLobbyStore().join(code, player);
  if (error === "lobbyNotFound" || error === "lobbyFull" || error === "raceInProgress") return { error, code: typed };
  if (error) return { error: "lobbyNotFound", code: typed };
  redirect(`/${locale}/lobby/${code}`);
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

export async function setLobbyReady(code: string, isReady: boolean): Promise<StoreError | null> {
  return lobbyCommand(code, (lobby, userId) => getLobbyStore().setReady(lobby, userId, isReady === true));
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

export async function sendLobbyMessage(code: string, text: string): Promise<StoreError | null> {
  return lobbyCommand(code, (lobby, userId) => getLobbyStore().sendMessage(lobby, userId, text));
}
