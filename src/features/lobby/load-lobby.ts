import "server-only";
import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { clientIp } from "@/lib/client-ip";
import { lobbyCodeLimiter } from "@/lib/lobby-join-limit";
import { normalizeLobbyCode } from "@/lib/lobby-code";
import { getLobbyStore } from "@/lib/lobby-server";

/**
 * Shared by the lobby pages: requires a valid code and a player (visitors first pick a guest nickname, then join),
 * then returns the viewer's snapshot (null for non-members).
 */
export async function loadLobby(locale: Locale, rawCode: string) {
  const code = normalizeLobbyCode(decodeURIComponent(rawCode));
  if (!code) notFound();
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/guest?next=${encodeURIComponent(`/${locale}/lobby/${code}`)}`);
  const store = getLobbyStore();
  const view = store.view(code, user.id);
  if (view) return { user, code, store, view, joinError: null };

  // A non-member probing a code counts as a code attempt (SALLE-10), whether the lobby exists or not.
  if (!lobbyCodeLimiter().allow(clientIp(await headers()))) return { user, code, store, view, joinError: "tooManyAttempts" as const };
  if (!store.exists(code)) notFound();
  // Non-members see a join form; tell them up front when the code alone cannot get them in.
  return { user, code, store, view, joinError: store.joinError(code, { id: user.id, name: user.username }) };
}
