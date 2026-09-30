import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HalftoneBackdrop } from "@/features/home/components/halftone-backdrop";
import { LobbyActions } from "@/features/lobby/components/lobby-actions";
import { LobbyHeader } from "@/features/lobby/components/lobby-header";
import { LobbyRoster } from "@/features/lobby/components/lobby-roster";
import { RulesDossier } from "@/features/lobby/components/rules-dossier";
import { TauntFeed } from "@/features/lobby/components/taunt-feed";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { canStartRace, countReady } from "@/lib/lobby";
import { mockLobby } from "@/mocks/lobby";
import { mockPlayer } from "@/mocks/player";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { lobby, metadata } = await getDictionary(locale);
  return { title: `${lobby.title} - ${metadata.title}` };
}

export default async function LobbyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { lobby: dictionary } = await getDictionary(locale);
  const lobby = mockLobby;

  return (
    <main className="min-h-[calc(100vh-140px)] w-full bg-surface-container-lowest pt-20">
      <div className="relative flex w-full flex-col">
        <HalftoneBackdrop />

        <div className="relative z-10 mx-auto flex w-full max-w-[1720px] flex-col gap-7 px-4 py-4 md:px-10">
          <LobbyHeader
            dictionary={dictionary.header}
            code={lobby.code}
            server={lobby.server}
            readyCount={countReady(lobby.players)}
            capacity={lobby.capacity}
          />

          <div className="grid grid-cols-1 items-start gap-7 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <LobbyRoster dictionary={dictionary} lobby={lobby} />
            </div>
            <div className="flex flex-col gap-4 xl:col-span-4">
              <RulesDossier dictionary={dictionary.rules} settings={lobby.settings} spectators={lobby.spectators} />
              <TauntFeed dictionary={dictionary.chat} messages={lobby.messages} currentPlayer={mockPlayer.name} />
            </div>
          </div>

          <LobbyActions dictionary={dictionary.actions} canStart={canStartRace(lobby.players)} />
        </div>
      </div>
    </main>
  );
}
