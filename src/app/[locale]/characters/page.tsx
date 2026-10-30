import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";
import { DEFAULT_CHARACTER } from "@/lib/characters";

/** Opens the player's own thief, or Joker for visitors. */
export default async function CharactersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await getCurrentUser();
  redirect(`/${locale}/characters/${user?.character ?? DEFAULT_CHARACTER}`);
}
