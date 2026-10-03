import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { HalftoneBackdrop } from "@/features/home/components/halftone-backdrop";
import { LobbyPresence } from "@/features/lobby/components/lobby-presence";
import { loadLobby } from "@/features/lobby/load-lobby";
import { CollapseReveal } from "@/features/results/components/collapse-reveal";
import { CombatDossier } from "@/features/results/components/combat-dossier";
import { KeyboardHeatmap } from "@/features/results/components/keyboard-heatmap";
import { ResultsActions } from "@/features/results/components/results-actions";
import { ResultsBanner } from "@/features/results/components/results-banner";
import { ResultsCutIn } from "@/features/results/components/results-cut-in";
import { ResultsPodium } from "@/features/results/components/results-podium";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { resultsVerdict } from "@/lib/cut-in";
import { rankRacers } from "@/lib/results";

type Params = { params: Promise<{ locale: string; code: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { results, metadata } = await getDictionary(locale);
  return { title: `${results.title} - ${metadata.title}` };
}

export default async function RaceResultsPage({ params }: Params) {
  const { locale, code: rawCode } = await params;
  if (!isLocale(locale)) notFound();

  const [{ user, code, store, view }, { results: dictionary }] = await Promise.all([loadLobby(locale, rawCode), getDictionary(locale)]);
  const lobbyHref = `/${locale}/lobby/${code}`;
  const result = store.result(code, user.id);
  if (!result) redirect(lobbyHref);
  const ranked = rankRacers(result.racers);
  const place = ranked.findIndex((racer) => racer.id === result.youId) + 1;
  const you = ranked[place - 1];
  if (!you) notFound();

  return (
    <main className="min-h-[calc(100vh-140px)] w-full bg-surface-container-lowest pt-20">
      <CollapseReveal />
      <ResultsCutIn dictionary={dictionary.cutIn} verdict={resultsVerdict(you.finishMs !== null, place, ranked.length)} />
      <div className="relative flex w-full flex-col">
        <HalftoneBackdrop />
        <div className="relative z-10 mx-auto w-full max-w-7xl space-y-6 px-4 py-4 md:px-10">
          <ResultsBanner dictionary={dictionary.banner} locale={locale} place={place} finished={you.finishMs !== null} wpm={you.wpm} />
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <ResultsPodium dictionary={dictionary.podium} locale={locale} racers={ranked} youId={result.youId} />
            <CombatDossier dictionary={dictionary.dossier} locale={locale} result={result} wpm={you.wpm} />
            <KeyboardHeatmap dictionary={dictionary.heatmap} keyStats={result.keyStats} />
          </div>
          <ResultsActions dictionary={dictionary.actions} lobbyHref={lobbyHref} />
          {view && <LobbyPresence locale={locale} initialView={view} />}
        </div>
      </div>
    </main>
  );
}
