import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { HalftoneBackdrop } from "@/features/home/components/halftone-backdrop";
import { JoinCodeCard } from "@/features/home/components/join-code-card";
import { LobbyRoom } from "@/features/lobby/components/lobby-room";
import { loadLobby } from "@/features/lobby/load-lobby";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";

type Params = { params: Promise<{ locale: string; code: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { lobby, metadata } = await getDictionary(locale);
  return { title: `${lobby.title} - ${metadata.title}` };
}

export default async function LobbyPage({ params }: Params) {
  const { locale, code: rawCode } = await params;
  if (!isLocale(locale)) notFound();

  const [{ code, view }, dictionary] = await Promise.all([loadLobby(locale, rawCode), getDictionary(locale)]);
  if (view && (view.phase === "countdown" || view.phase === "racing") && view.race?.you) {
    redirect(`/${locale}/lobby/${code}/race`);
  }

  return (
    <main className="min-h-[calc(100vh-140px)] w-full bg-surface-container-lowest pt-20">
      <div className="relative flex w-full flex-col">
        <HalftoneBackdrop />

        <div className="relative z-10 mx-auto flex w-full max-w-[1720px] flex-col gap-7 px-4 py-4 md:px-10">
          {view ? (
            <LobbyRoom dictionary={dictionary.lobby} locale={locale} initialView={view} />
          ) : (
            // Opened from an invite link: join first.
            <div className="mx-auto w-full max-w-md py-10">
              <JoinCodeCard dictionary={dictionary.home.joinCode} locale={locale} defaultCode={code} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
