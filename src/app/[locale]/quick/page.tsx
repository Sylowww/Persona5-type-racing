import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageBackdrop } from "@/components/layout/page-backdrop";
import { PageHeading } from "@/components/ui/page-heading";
import { QuickMatchSearch } from "@/features/quick/components/quick-match-search";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { quick, metadata } = await getDictionary(locale);
  return { title: `${quick.metaTitle} - ${metadata.title}` };
}

export default async function QuickPlayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Racing needs an account until guest sessions exist (same as creating a lobby).
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/guest?next=${encodeURIComponent(`/${locale}/quick`)}`);
  const { quick, profile, lobby } = await getDictionary(locale);

  return (
    <main className="min-h-[calc(100vh-130px)] w-full bg-surface-container-lowest pt-16">
      <div className="relative flex w-full flex-col">
        <PageBackdrop />
        <div className="relative z-10 mx-auto flex w-full max-w-[640px] flex-col gap-10 px-4 py-10 md:py-14">
          <PageHeading eyebrow={quick.tape} title={quick.title}>
            {quick.hint}
          </PageHeading>
          <QuickMatchSearch
            dictionary={quick}
            characterNames={profile.character.names}
            botNames={lobby.bots.difficulties}
            locale={locale}
          />
        </div>
      </div>
    </main>
  );
}
