import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageBackdrop } from "@/components/layout/page-backdrop";
import { CharacterPicker } from "@/features/profile/components/character-picker";
import { ProfileCard } from "@/features/profile/components/profile-card";
import { ProfileEditor } from "@/features/profile/components/profile-editor";
import { ProfileStats } from "@/features/profile/components/profile-stats";
import { RaceHistory } from "@/features/profile/components/race-history";
import { SignInMethods } from "@/features/profile/components/sign-in-methods";
import { getDictionary } from "@/i18n/dictionaries";
import { formatMessage } from "@/i18n/format";
import { isLocale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";
import { getPlayerStats, getRacePage, getWpmProgress } from "@/lib/race-history-db";
import { pageSchema } from "@/lib/schemas";
import { getLinkedProviders } from "@/lib/users";

/** Races per history page (HIST-01). */
const HISTORY_PAGE_SIZE = 10;
/** Races on the WPM progress chart (AUTH-06). */
const PROGRESS_RACE_COUNT = 50;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { profile, metadata } = await getDictionary(locale);
  return { title: `${profile.metaTitle} - ${metadata.title}` };
}

type ProfilePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const [{ locale }, { page: rawPage }] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();

  const user = await getCurrentUser();
  if (user?.kind !== "registered") redirect(`/${locale}/sign-in`);
  const page = pageSchema.parse(rawPage);

  const [{ profile }, providers, stats, history, progress] = await Promise.all([
    getDictionary(locale),
    getLinkedProviders(user.id),
    getPlayerStats(user.id),
    getRacePage(user.id, page, HISTORY_PAGE_SIZE),
    getWpmProgress(user.id, PROGRESS_RACE_COUNT),
  ]);
  const pageCount = Math.max(1, Math.ceil(history.total / HISTORY_PAGE_SIZE));
  if (page > pageCount) redirect(`/${locale}/profile?page=${pageCount}#history`);

  return (
    <main className="min-h-[calc(100vh-130px)] w-full bg-surface-container-lowest pt-16">
      <div className="relative flex w-full flex-col">
        <PageBackdrop />

        <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col gap-12 px-4 py-10 md:px-10 md:py-14">
          <ProfileCard locale={locale} dictionary={profile} user={user} />
          <ProfileEditor
            dictionary={profile.edit}
            username={user.username}
            avatarUrl={user.avatarUrl}
            avatarAlt={formatMessage(profile.avatarAlt, { name: user.username })}
          />
          <CharacterPicker dictionary={profile.character} selected={user.character} />
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
            <div className="flex flex-col gap-8 lg:col-span-2">
              <ProfileStats dictionary={profile.stats} locale={locale} stats={stats} progress={progress} />
              <RaceHistory locale={locale} dictionary={profile.history} races={history.races} page={page} pageCount={pageCount} />
            </div>
            <SignInMethods dictionary={profile.accounts} email={user.email} providers={providers} />
          </div>
        </div>
      </div>
    </main>
  );
}
