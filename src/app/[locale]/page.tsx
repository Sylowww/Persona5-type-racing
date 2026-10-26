import { notFound } from "next/navigation";
import { CallingCardBanner } from "@/features/home/components/calling-card-banner";
import { HomeHero } from "@/features/home/components/home-hero";
import { PageBackdrop } from "@/components/layout/page-backdrop";
import { HomeMenu } from "@/features/home/components/home-menu";
import { JoinCodeCard } from "@/features/home/components/join-code-card";
import { PhantomMarquee } from "@/features/home/components/phantom-marquee";
import { PhantomShowcase } from "@/features/home/components/phantom-showcase";
import { PlayerDossier } from "@/features/home/components/player-dossier";
import { TypingPreview } from "@/features/home/components/typing-preview";
import { startTraining } from "@/features/lobby/actions";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";
import { DEFAULT_CHARACTER } from "@/lib/characters";
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
  const character = currentUser?.character ?? DEFAULT_CHARACTER;

  return (
    <main className="min-h-[calc(100vh-130px)] w-full bg-surface-container-lowest pt-16">
      <HomeHero dictionary={home.hero} />

      <div className="relative flex w-full flex-col">
        <PageBackdrop />
        <h1 className="sr-only">{dictionary.title}</h1>

        <section className="relative z-10 mx-auto grid w-full max-w-[1600px] grid-cols-1 items-center gap-12 px-4 pt-12 pb-6 md:px-10 md:pt-16 lg:grid-cols-12">
          <div className="flex flex-col gap-10 lg:col-span-7">
            <CallingCardBanner dictionary={home.callingCard} />
            <HomeMenu dictionary={home} locale={locale} training={startTraining.bind(null, locale)} />
          </div>
          <div className="lg:col-span-5">
            <PhantomShowcase dictionary={home.showcase} name={dictionary.profile.character.names[character]} locale={locale} character={character} />
          </div>
        </section>

        <PhantomMarquee phrases={home.marquee} />

        <div className="relative z-10 mx-auto grid w-full max-w-[1600px] grid-cols-1 items-start gap-10 px-4 pt-6 pb-14 md:px-10 xl:grid-cols-12 xl:gap-14">
          <div className="flex flex-col gap-10 xl:col-span-7">
            <JoinCodeCard dictionary={home.joinCode} locale={locale} />
            <TypingPreview dictionary={home.typingPreview} />
          </div>

          <div className="xl:col-span-5">
            <PlayerDossier locale={locale} dictionary={home.dossier} user={user} stats={stats} radar={skillRadar(recentRaces)} />
          </div>
        </div>
      </div>
    </main>
  );
}
