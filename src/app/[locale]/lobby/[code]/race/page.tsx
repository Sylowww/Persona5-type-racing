import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { PageBackdrop } from "@/components/layout/page-backdrop";
import { loadLobby } from "@/features/lobby/load-lobby";
import { LiveRace } from "@/features/race/components/live-race";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";

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

  const [{ code, view }, { race: dictionary }] = await Promise.all([loadLobby(locale, rawCode), getDictionary(locale)]);
  if (view?.phase === "finished" && view.hasResult) redirect(`/${locale}/lobby/${code}/results`);
  // Racers and spectators (who have no `you`) both watch the race here.
  if (!view || view.phase === "waiting" || !view.race) redirect(`/${locale}/lobby/${code}`);

  return (
    <main className="min-h-[calc(100vh-130px)] w-full bg-surface-container-lowest pt-16">
      <div className="relative flex w-full flex-col">
        <PageBackdrop />
        {/* Bottom room: Mona's comms bubble is fixed at the bottom left, and the text must be able to scroll above it. */}
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 pt-4 pb-48 md:px-10">
          {/* Phones get a message instead of the race (DES-06): typing races need a physical keyboard. */}
          <section className="mx-auto flex max-w-md flex-col items-center gap-4 bg-surface-container p-6 text-center shadow-hard-xl md:hidden">
            <Icon name="keyboard" size={48} className="text-primary-container" />
            <h1 className="font-display text-headline-md uppercase italic text-secondary">{dictionary.mobile.title}</h1>
            <p className="text-on-surface-variant">{dictionary.mobile.text}</p>
            <Link
              href={`/${locale}/lobby/${code}`}
              className="-skew-x-6 bg-primary-container px-4 py-2 font-hud text-headline-sm font-black uppercase italic text-on-primary-container shadow-hard-sm"
            >
              {dictionary.mobile.back}
            </Link>
          </section>
          <div className="hidden md:block">
            <LiveRace dictionary={dictionary} locale={locale} initialView={view} />
          </div>
        </div>
      </div>
    </main>
  );
}
