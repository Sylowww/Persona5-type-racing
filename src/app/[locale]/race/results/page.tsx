import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HalftoneBackdrop } from "@/features/home/components/halftone-backdrop";
import { CombatDossier } from "@/features/results/components/combat-dossier";
import { KeyboardHeatmap } from "@/features/results/components/keyboard-heatmap";
import { ResultsActions } from "@/features/results/components/results-actions";
import { ResultsBanner } from "@/features/results/components/results-banner";
import { ResultsPodium } from "@/features/results/components/results-podium";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { rankRacers } from "@/lib/results";
import { mockRaceResult } from "@/mocks/race-result";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { results, metadata } = await getDictionary(locale);
  return { title: `${results.title} - ${metadata.title}` };
}

export default async function RaceResultsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { results: dictionary } = await getDictionary(locale);
  const result = mockRaceResult;
  const ranked = rankRacers(result.racers);
  const place = ranked.findIndex((racer) => racer.id === result.youId) + 1;
  const you = ranked[place - 1];
  if (!you) notFound();

  return (
    <main className="min-h-[calc(100vh-140px)] w-full bg-surface-container-lowest pt-20">
      <div className="relative flex w-full flex-col">
        <HalftoneBackdrop />
        <div className="relative z-10 mx-auto w-full max-w-7xl space-y-6 px-4 py-4 md:px-10">
          <ResultsBanner dictionary={dictionary.banner} locale={locale} place={place} finished={you.finishMs !== null} wpm={you.wpm} />
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <ResultsPodium dictionary={dictionary.podium} locale={locale} racers={ranked} youId={result.youId} />
            <CombatDossier dictionary={dictionary.dossier} locale={locale} result={result} wpm={you.wpm} />
            <KeyboardHeatmap dictionary={dictionary.heatmap} keyStats={result.keyStats} />
          </div>
          <ResultsActions dictionary={dictionary.actions} locale={locale} />
        </div>
      </div>
    </main>
  );
}
