import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { PageBackdrop } from "@/components/layout/page-backdrop";
import { ResultsReport } from "@/features/results/components/results-report";
import { getDictionary } from "@/i18n/dictionaries";
import { formatMessage } from "@/i18n/format";
import { isLocale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";
import { isPersonalBest } from "@/lib/race-history";
import { getBestWpmBefore, getSavedResult } from "@/lib/race-history-db";
import { rankRacers } from "@/lib/results";
import { uuidSchema } from "@/lib/schemas";

type Params = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { results, metadata } = await getDictionary(locale);
  return { title: `${results.archive.metaTitle} - ${metadata.title}` };
}

/** A saved race's full results, opened from the profile history (HIST-02). Only its owner can see it. */
export default async function SavedRacePage({ params }: Params) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const user = await getCurrentUser();
  if (user?.kind !== "registered") redirect(`/${locale}/sign-in`);
  const raceId = uuidSchema.safeParse(id);
  if (!raceId.success) notFound();

  const [result, { results: dictionary, race: raceDictionary }] = await Promise.all([getSavedResult(user.id, raceId.data), getDictionary(locale)]);
  if (!result) notFound();
  const ranked = rankRacers(result.racers);
  const place = ranked.findIndex((racer) => racer.id === result.youId) + 1;
  const you = ranked[place - 1];
  if (!you) notFound();
  const previousBest = await getBestWpmBefore(user.id, result.endedAt);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" });

  return (
    <main className="min-h-[calc(100vh-130px)] w-full bg-surface-container-lowest pt-16">
      <div className="relative flex w-full flex-col">
        <PageBackdrop />
        <div className="relative z-10 mx-auto w-full max-w-7xl space-y-10 px-4 py-10 md:px-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-hud text-label-hud font-black uppercase tracking-widest text-on-surface-variant">
              {formatMessage(dictionary.archive.eyebrow, { date: date.format(result.endedAt) })}
            </p>
            <Link
              href={`/${locale}/profile`}
              className="btn-ghost px-4 py-2"
            >
              <Icon name="chevron_left" size={18} />
              {dictionary.archive.back}
            </Link>
          </div>
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
        </div>
      </div>
    </main>
  );
}
