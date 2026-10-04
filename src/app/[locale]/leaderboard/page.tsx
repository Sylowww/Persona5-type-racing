import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HalftoneBackdrop } from "@/features/home/components/halftone-backdrop";
import { LeaderboardPagination } from "@/features/leaderboard/components/leaderboard-pagination";
import { LeaderboardTable } from "@/features/leaderboard/components/leaderboard-table";
import { getDictionary } from "@/i18n/dictionaries";
import { formatMessage } from "@/i18n/format";
import { isLocale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";
import { LEADERBOARD_SIZE, leaderboardPageCount, parseLeaderboardPage } from "@/lib/leaderboard";
import { countLeaderboard, getLeaderboardPage } from "@/lib/leaderboard-db";

type LeaderboardPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { leaderboard, metadata } = await getDictionary(locale);
  return { title: `${leaderboard.metaTitle} - ${metadata.title}` };
}

export default async function LeaderboardPage({ params, searchParams }: LeaderboardPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [{ leaderboard }, user, total, query] = await Promise.all([getDictionary(locale), getCurrentUser(), countLeaderboard(), searchParams]);
  const pageCount = leaderboardPageCount(total);
  const page = parseLeaderboardPage(query.page, pageCount);
  const rows = await getLeaderboardPage(page);

  return (
    <main className="min-h-[calc(100vh-140px)] w-full bg-surface-container-lowest pt-20">
      <div className="relative flex w-full flex-col">
        <HalftoneBackdrop />

        <div className="relative z-10 mx-auto flex w-full max-w-[900px] flex-col gap-6 px-4 py-10 md:px-10">
          <header className="flex flex-col gap-2">
            <span className="w-fit -rotate-2 bg-secondary-fixed px-3 py-0.5 font-hud text-label-hud font-black uppercase text-on-secondary-fixed shadow-hard-xs">
              {formatMessage(leaderboard.tape, { count: LEADERBOARD_SIZE })}
            </span>
            <h1 className="font-display text-headline-lg uppercase italic tracking-wider text-secondary">{leaderboard.title}</h1>
            <p className="text-on-surface-variant">{leaderboard.subtitle}</p>
          </header>

          <section className="flex flex-col gap-4 bg-surface-container p-4 shadow-hard-xl shadow-primary-container sm:p-6">
            <LeaderboardTable dictionary={leaderboard} rows={rows} youId={user?.kind === "registered" ? user.id : null} />
            {rows.length > 0 && <LeaderboardPagination dictionary={leaderboard} locale={locale} page={page} pageCount={pageCount} />}
          </section>
        </div>
      </div>
    </main>
  );
}
