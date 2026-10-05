import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { HalftoneBackdrop } from "@/features/home/components/halftone-backdrop";
import { LobbyBrowser } from "@/features/lobbies/components/lobby-browser";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";
import { getLobbyStore } from "@/lib/lobby-server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { lobbies, metadata } = await getDictionary(locale);
  return { title: `${lobbies.metaTitle} - ${metadata.title}` };
}

export default async function LobbiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Joining needs an account until guest sessions exist (same as creating a lobby).
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/sign-in`);
  const { lobbies, lobby } = await getDictionary(locale);

  return (
    <main className="min-h-[calc(100vh-140px)] w-full bg-surface-container-lowest pt-20">
      <div className="relative flex w-full flex-col">
        <HalftoneBackdrop />
        <div className="relative z-10 mx-auto flex w-full max-w-[900px] flex-col gap-6 px-4 py-10 md:px-10">
          <header className="flex flex-col gap-2">
            <span className="w-fit -rotate-2 bg-secondary-fixed px-3 py-0.5 font-hud text-label-hud font-black uppercase text-on-secondary-fixed shadow-hard-xs">
              {lobbies.tape}
            </span>
            <h1 className="font-display text-headline-lg uppercase italic tracking-wider text-secondary">{lobbies.title}</h1>
            <p className="text-on-surface-variant">{lobbies.subtitle}</p>
          </header>
          <LobbyBrowser dictionary={lobbies} modeNames={lobby.rules.mode} locale={locale} lobbies={getLobbyStore().listPublic()} />
        </div>
      </div>
    </main>
  );
}
