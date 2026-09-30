import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { HalftoneBackdrop } from "@/features/home/components/halftone-backdrop";
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
  if (!view || view.phase === "waiting" || !view.race?.you) redirect(`/${locale}/lobby/${code}`);

  return (
    <main className="min-h-[calc(100vh-140px)] w-full bg-surface-container-lowest pt-20">
      <div className="relative flex w-full flex-col">
        <HalftoneBackdrop />
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 py-4 md:px-10">
          <LiveRace dictionary={dictionary} locale={locale} initialView={view} />
        </div>
      </div>
    </main>
  );
}
