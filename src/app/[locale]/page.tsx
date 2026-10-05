import { notFound } from "next/navigation";
import { CallingCardBanner } from "@/features/home/components/calling-card-banner";
import { HalftoneBackdrop } from "@/features/home/components/halftone-backdrop";
import { JoinCodeCard } from "@/features/home/components/join-code-card";
import { ModeCard } from "@/features/home/components/mode-card";
import { PlayerDossier } from "@/features/home/components/player-dossier";
import { StartRaceButton } from "@/features/home/components/start-race-button";
import { TypingPreview } from "@/features/home/components/typing-preview";
import { startTraining } from "@/features/lobby/actions";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";
import { RADAR_RACE_COUNT, skillRadar } from "@/lib/radar";
import { getPlayerStats, getRecentRaces } from "@/lib/race-history-db";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [dictionary, currentUser] = await Promise.all([getDictionary(locale), getCurrentUser()]);
  const user = currentUser?.kind === "registered" ? currentUser : null;
  const [stats, recentRaces] = user
    ? await Promise.all([getPlayerStats(user.id), getRecentRaces(user.id, RADAR_RACE_COUNT)])
    : [null, []];
  const { home } = dictionary;
  const { modes } = home;

  return (
    <main className="min-h-[calc(100vh-140px)] w-full bg-surface-container-lowest pt-20">
      <div className="relative flex w-full flex-col">
        <HalftoneBackdrop />
        <h1 className="sr-only">{dictionary.title}</h1>

        <div className="relative z-10 grid w-full grid-cols-1 items-start gap-7 px-4 py-4 md:px-10 lg:grid-cols-12">
          <div className="flex flex-col gap-7 lg:col-span-7">
            <CallingCardBanner dictionary={home.callingCard} />
            <StartRaceButton dictionary={home.startRace} locale={locale} />

            <div className="grid grid-cols-1 gap-4 pt-1 md:grid-cols-2">
              <ModeCard variant="blitz" {...modes.blitz} target={{ href: `/${locale}/quick` }} />
              <ModeCard variant="training" {...modes.training} target={{ run: startTraining.bind(null, locale) }} />
              <ModeCard variant="browse" {...modes.browse} target={{ href: `/${locale}/lobbies` }} />
              <JoinCodeCard dictionary={home.joinCode} locale={locale} />
            </div>

            <TypingPreview dictionary={home.typingPreview} />
          </div>

          <div className="flex flex-col gap-4 lg:col-span-5">
            <PlayerDossier locale={locale} dictionary={home.dossier} user={user} stats={stats} radar={skillRadar(recentRaces)} />
          </div>
        </div>
      </div>
    </main>
  );
}
