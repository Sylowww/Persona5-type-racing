import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import type { RaceResult, ResultRacer } from "@/types/race";
import { CombatDossier } from "./combat-dossier";
import { KeyboardHeatmap } from "./keyboard-heatmap";
import { ResultsBanner } from "./results-banner";
import { ResultsPodium } from "./results-podium";
import { ResultsTable } from "./results-table";
import { WpmRaceChart } from "./wpm-race-chart";

type ResultsReportProps = {
  dictionary: Dictionary["results"];
  locale: Locale;
  result: RaceResult;
  /** `result.racers`, ranked. */
  ranked: readonly ResultRacer[];
  you: ResultRacer;
  place: number;
  /** The record this race beat (RES-04); null when it is not a new personal best. */
  beatenRecord: number | null;
};

/** The full results of a race, shown right after it and again from the history (HIST-02). */
export function ResultsReport({ dictionary, locale, result, ranked, you, place, beatenRecord }: ResultsReportProps) {
  return (
    <>
      <ResultsBanner
        dictionary={dictionary.banner}
        locale={locale}
        place={place}
        finished={you.finishMs !== null}
        wpm={you.wpm}
        beatenRecord={beatenRecord}
      />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <ResultsPodium dictionary={dictionary.podium} locale={locale} racers={ranked} youId={result.youId} />
        <CombatDossier dictionary={dictionary.dossier} locale={locale} result={result} wpm={you.wpm} />
        <KeyboardHeatmap dictionary={dictionary.heatmap} keyStats={result.keyStats} />
      </div>
      <WpmRaceChart dictionary={dictionary.raceChart} locale={locale} racers={ranked} youId={result.youId} />
      <ResultsTable dictionary={dictionary.table} locale={locale} racers={ranked} youId={result.youId} />
    </>
  );
}
