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
  const view = store.view(code, user.id);
  // Non-members see a join form; tell them up front when the code alone cannot get them in.
  const joinError = view ? null : store.joinError(code, { id: user.id, name: user.username });
  return { user, code, store, view, joinError };
}
