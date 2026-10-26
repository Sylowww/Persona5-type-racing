import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageBackdrop } from "@/components/layout/page-backdrop";
import { LobbyPresence } from "@/features/lobby/components/lobby-presence";
import { loadLobby } from "@/features/lobby/load-lobby";
import { CollapseReveal } from "@/features/results/components/collapse-reveal";
import { ResultsActions } from "@/features/results/components/results-actions";
import { ResultsCutIn } from "@/features/results/components/results-cut-in";
import { RankUp } from "@/features/results/components/rank-up";
import { ResultsReport } from "@/features/results/components/results-report";
import { SaveGuestRace } from "@/features/results/components/save-guest-race";
import { VelvetRoomDecor, VelvetRoomLine } from "@/features/race/components/velvet-room";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { resultsVerdict } from "@/lib/cut-in";
import { isPersonalBest, recordFromResult } from "@/lib/race-history";
import { rankUpAfterRace } from "@/lib/confidants";
import { getBestWpmBefore, getRacesByCharacter } from "@/lib/race-history-db";
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

  const [{ user, code, store, view }, { results: dictionary, lobby: lobbyDictionary, race: raceDictionary, confidants, profile }] = await Promise.all([
    loadLobby(locale, rawCode),
    getDictionary(locale),
  ]);
  const lobbyHref = `/${locale}/lobby/${code}`;
  const result = store.result(code, user.id);
  if (!result) redirect(lobbyHref);
  const ranked = rankRacers(result.racers);
  const place = ranked.findIndex((racer) => racer.id === result.youId) + 1;
  const you = ranked[place - 1];
  if (!you) notFound();
  // Registered players' results are saved by the server when the race ends; guests keep theirs in this tab.
  // Training races are practice only and never saved.
  const guestRecord = user.kind === "guest" && view?.kind !== "training" ? recordFromResult(result) : null;
  // Only saved races count toward a personal best (RES-04): guests have no saved history and training is never saved.
  const previousBest = user.kind === "registered" && view?.kind !== "training" ? await getBestWpmBefore(user.id, result.endedAt) : null;
  // Each saved race raises the bond with the thief raced as: a rank up gets its tarot card.
  const bondRaces =
    user.kind === "registered" && view?.kind !== "training" ? ((await getRacesByCharacter(user.id, result.endedAt))[you.character] ?? 0) + 1 : null;
  const rankUp = bondRaces === null ? null : rankUpAfterRace(bondRaces - 1);
  // Training ends in the Velvet Room too, with Igor's word.
  const isTraining = view?.kind === "training";

  return (
    <main className={`min-h-[calc(100vh-130px)] w-full bg-surface-container-lowest pt-16 ${isTraining ? "velvet-room" : ""}`}>
      <CollapseReveal />
      <ResultsCutIn dictionary={dictionary.cutIn} verdict={resultsVerdict(you.finishMs !== null, place, ranked.length)} />
      <div className="relative flex w-full flex-col">
        <PageBackdrop />
        {isTraining && <VelvetRoomDecor />}
        <div className="relative z-10 mx-auto w-full max-w-7xl space-y-10 px-4 py-10 md:px-10">
          {isTraining && <VelvetRoomLine dictionary={raceDictionary.velvetRoom} speaker={raceDictionary.velvetRoom.igor} line={raceDictionary.velvetRoom.farewell} />}
          {rankUp !== null && bondRaces !== null && (
            <RankUp dictionary={confidants} character={you.character} name={profile.character.names[you.character]} rank={rankUp} races={bondRaces} />
          )}
          <ResultsReport
            dictionary={dictionary}
            raceDictionary={raceDictionary}
            locale={locale}
            result={result}
            ranked={ranked}
            you={you}
            place={place}
            beatenRecord={isPersonalBest(you.wpm, previousBest) ? previousBest : null}
          />
          <ResultsActions
            dictionary={dictionary.actions}
            lobbyHref={lobbyHref}
            close={
              view?.kind === "custom" && view.players.some((player) => player.id === user.id && player.isHost)
                ? { code, locale, label: lobbyDictionary.actions.close, confirmMessage: lobbyDictionary.actions.closeConfirm }
                : null
            }
          />
          {view && <LobbyPresence locale={locale} initialView={view} />}
          {guestRecord && <SaveGuestRace record={guestRecord} />}
        </div>
      </div>
    </main>
  );
}
