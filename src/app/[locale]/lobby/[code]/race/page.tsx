import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { PageBackdrop } from "@/components/layout/page-backdrop";
import { loadLobby } from "@/features/lobby/load-lobby";
import { LiveRace } from "@/features/race/components/live-race";
import { VelvetRoomDecor, VelvetRoomLine } from "@/features/race/components/velvet-room";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { getPlayerStats } from "@/lib/race-history-db";

type Params = { params: Promise<{ locale: string; code: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { race, metadata } = await getDictionary(locale);
  return { title: `${race.title} - ${metadata.title}` };
}

export default async function RacePage({ params }: Params) {
  const { locale, code: rawCode } = await params;
  if (!isLocale(locale)) notFound();

  const [{ user, code, view }, { race: dictionary }] = await Promise.all([loadLobby(locale, rawCode), getDictionary(locale)]);
  if (view?.phase === "finished" && view.hasResult) redirect(`/${locale}/lobby/${code}/results`);
  // Racers and spectators (who have no `you`) both watch the race here.
  if (!view || view.phase === "waiting" || !view.race) redirect(`/${locale}/lobby/${code}`);
  // The Third Eye ghost runs at the player's record; guests keep theirs in the tab (read by the race page).
  const isGuest = user.kind !== "registered";
  const recordWpm = isGuest ? null : (await getPlayerStats(user.id)).bestWpm || null;
  // Training races take place in the Velvet Room: blue palette, drapes and Lavenza's welcome.
  const isTraining = view.kind === "training";

  return (
    <main className={`min-h-[calc(100vh-130px)] w-full bg-surface-container-lowest pt-16 ${isTraining ? "velvet-room" : ""}`}>
      <div className="relative flex w-full flex-col">
        <PageBackdrop />
        {isTraining && <VelvetRoomDecor />}
        {/* Bottom room: Mona's comms bubble is fixed at the bottom left, and the text must be able to scroll above it. */}
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 pt-8 pb-48 md:px-10">
          {/* Phones get a message instead of the race (DES-06): typing races need a physical keyboard. */}
          <section className="panel mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center md:hidden">
            <Icon name="keyboard" size={48} className="text-primary-container" />
            <h1 className="font-display text-headline-md uppercase italic text-secondary">{dictionary.mobile.title}</h1>
            <p className="text-on-surface-variant">{dictionary.mobile.text}</p>
            <Link
              href={`/${locale}/lobby/${code}`}
              className="btn-primary"
            >
              {dictionary.mobile.back}
            </Link>
          </section>
          <div className="hidden md:block">
            {isTraining && <VelvetRoomLine dictionary={dictionary.velvetRoom} speaker={dictionary.velvetRoom.lavenza} line={dictionary.velvetRoom.welcome} />}
            <LiveRace dictionary={dictionary} locale={locale} initialView={view} recordWpm={recordWpm} isGuest={isGuest} />
          </div>
        </div>
      </div>
    </main>
  );
}
