import "server-only";
import { notFound, redirect } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";
import { normalizeLobbyCode } from "@/lib/lobby-code";
import { getLobbyStore } from "@/lib/lobby-server";

/** Shared by the lobby pages: requires a signed-in player and a valid code, then returns the viewer's snapshot (null for non-members). */
export async function loadLobby(locale: Locale, rawCode: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/sign-in`);
  const code = normalizeLobbyCode(decodeURIComponent(rawCode));
  const store = getLobbyStore();
  if (!code || !store.exists(code)) notFound();
  return { user, code, store, view: store.view(code, user.id) };
}
