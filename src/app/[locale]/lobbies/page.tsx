import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageBackdrop } from "@/components/layout/page-backdrop";
import { PageHeading } from "@/components/ui/page-heading";
import { LobbyBrowser } from "@/features/lobbies/components/lobby-browser";
import { QuickRaceCard } from "@/features/lobbies/components/quick-race-card";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";
import { getLobbyStore } from "@/lib/lobby-server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { lobbies, metadata } = await getDictionary(locale);
  return { title: `${lobbies.metaTitle} - ${metadata.title}` };
}

export default async function LobbiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Visitors pick a guest nickname first: guests can join lobbies, not open them.
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/guest?next=${encodeURIComponent(`/${locale}/lobbies`)}`);
  const { lobbies, lobby } = await getDictionary(locale);

  return (
    <main className="min-h-[calc(100vh-130px)] w-full bg-surface-container-lowest pt-16">
      <div className="relative flex w-full flex-col">
        <PageBackdrop />
        <div className="relative z-10 mx-auto flex w-full max-w-[900px] flex-col gap-6 px-4 py-10 md:px-10">
          <PageHeading eyebrow={lobbies.tape} title={lobbies.title}>
            {lobbies.subtitle}
          </PageHeading>
          <QuickRaceCard dictionary={lobbies.quickRace} errors={lobbies.errors} locale={locale} />
          <LobbyBrowser dictionary={lobbies} modeNames={lobby.rules.mode} complexityNames={lobby.rules.text.complexities} locale={locale} lobbies={getLobbyStore().listPublic()} />
        </div>
      </div>
    </main>
  );
}
