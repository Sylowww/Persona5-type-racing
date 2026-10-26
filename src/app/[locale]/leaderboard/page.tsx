import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageBackdrop } from "@/components/layout/page-backdrop";
import { PageHeading } from "@/components/ui/page-heading";
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
    <main className="min-h-[calc(100vh-130px)] w-full bg-surface-container-lowest pt-16">
      <div className="relative flex w-full flex-col">
        <PageBackdrop />

        <div className="relative z-10 mx-auto flex w-full max-w-[960px] flex-col gap-10 px-4 py-10 md:px-10 md:py-14">
          <PageHeading eyebrow={formatMessage(leaderboard.tape, { count: LEADERBOARD_SIZE })} title={leaderboard.title}>
            {leaderboard.subtitle}
          </PageHeading>

          <section className="flex flex-col gap-5">
            <LeaderboardTable dictionary={leaderboard} rows={rows} youId={user?.kind === "registered" ? user.id : null} />
            {rows.length > 0 && <LeaderboardPagination dictionary={leaderboard} locale={locale} page={page} pageCount={pageCount} />}
          </section>
        </div>
      </div>
    </main>
  );
}
