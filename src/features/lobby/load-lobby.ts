import "server-only";
import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";
import { normalizeLobbyCode } from "@/lib/lobby-code";
import { getLobbyStore } from "@/lib/lobby-server";

/**
 * Shared by the lobby pages: requires a valid code and a player (visitors first pick a guest nickname, then join),
 * then returns the viewer's snapshot (null for non-members).
 */
export async function loadLobby(locale: Locale, rawCode: string) {
  const code = normalizeLobbyCode(decodeURIComponent(rawCode));
  const store = getLobbyStore();
  if (!code || !store.exists(code)) notFound();
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/guest?next=${encodeURIComponent(`/${locale}/lobby/${code}`)}`);
  return { user, code, store, view: store.view(code, user.id) };
}
