import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { HalftoneBackdrop } from "@/features/home/components/halftone-backdrop";
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
  if (!user) redirect(`/${locale}/sign-in`);
  const { quick, profile, lobby } = await getDictionary(locale);

  return (
    <main className="min-h-[calc(100vh-140px)] w-full bg-surface-container-lowest pt-20">
      <div className="relative flex w-full flex-col">
        <HalftoneBackdrop />
        <div className="relative z-10 mx-auto flex w-full max-w-[640px] flex-col gap-6 px-4 py-10">
          <header className="flex flex-col gap-2">
            <span className="w-fit -rotate-2 bg-secondary-fixed px-3 py-0.5 font-hud text-label-hud font-black uppercase text-on-secondary-fixed shadow-hard-xs">
              {quick.tape}
            </span>
            <h1 className="font-display text-headline-lg uppercase italic tracking-wider text-secondary">{quick.title}</h1>
            <p className="text-on-surface-variant">{quick.hint}</p>
          </header>
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
