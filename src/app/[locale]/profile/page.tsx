import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { HalftoneBackdrop } from "@/features/home/components/halftone-backdrop";
import { CharacterPicker } from "@/features/profile/components/character-picker";
import { ProfileCard } from "@/features/profile/components/profile-card";
import { ProfileStats } from "@/features/profile/components/profile-stats";
import { RaceHistory } from "@/features/profile/components/race-history";
import { SignInMethods } from "@/features/profile/components/sign-in-methods";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";
import { getLinkedProviders } from "@/lib/users";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { profile, metadata } = await getDictionary(locale);
  return { title: `${profile.metaTitle} - ${metadata.title}` };
}

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const user = await getCurrentUser();
  if (user?.kind !== "registered") redirect(`/${locale}/sign-in`);

  const [{ profile }, providers] = await Promise.all([getDictionary(locale), getLinkedProviders(user.id)]);

  return (
    <main className="min-h-[calc(100vh-140px)] w-full bg-surface-container-lowest pt-20">
      <div className="relative flex w-full flex-col">
        <HalftoneBackdrop />

        <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-10 md:px-10">
          <ProfileCard locale={locale} dictionary={profile} user={user} />
          <CharacterPicker dictionary={profile.character} selected={user.character} />
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-6 lg:col-span-2">
              <ProfileStats dictionary={profile.stats} />
              <RaceHistory locale={locale} dictionary={profile.history} />
            </div>
            <SignInMethods dictionary={profile.accounts} email={user.email} providers={providers} />
          </div>
        </div>
      </div>
    </main>
  );
}
