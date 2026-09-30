import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";
import { getLobbyStore } from "@/lib/lobby-server";

/** Nav entry point: back to the player's current lobby, or home to create or join one. */
export default async function LobbyIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await getCurrentUser();
  const code = user ? getLobbyStore().lobbyOf(user.id) : null;
  redirect(code ? `/${locale}/lobby/${code}` : `/${locale}`);
}
