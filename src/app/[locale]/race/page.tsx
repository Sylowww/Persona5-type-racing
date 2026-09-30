import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HalftoneBackdrop } from "@/features/home/components/halftone-backdrop";
import { LiveRace } from "@/features/race/components/live-race";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { mockRace } from "@/mocks/race";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { race, metadata } = await getDictionary(locale);
  return { title: `${race.title} - ${metadata.title}` };
}

export default async function RacePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { race: dictionary } = await getDictionary(locale);

  return (
    <main className="min-h-[calc(100vh-140px)] w-full bg-surface-container-lowest pt-20">
      <div className="relative flex w-full flex-col">
        <HalftoneBackdrop />
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 py-4 md:px-10">
          <LiveRace dictionary={dictionary} locale={locale} race={mockRace} />
        </div>
      </div>
    </main>
  );
}
