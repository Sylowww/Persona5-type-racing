import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageBackdrop } from "@/components/layout/page-backdrop";
import { Compendium } from "@/features/compendium/components/compendium";
import { loadCompendium } from "@/features/compendium/load-compendium";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { compendium, metadata } = await getDictionary(locale);
  return { title: `${compendium.metaTitle} - ${metadata.title}` };
}

export default async function CompendiumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [dictionary, user] = await Promise.all([getDictionary(locale), getCurrentUser()]);
  // Cards turn over with saved races, so only registered players have a collection.
  const registered = user?.kind === "registered" ? user : null;
  const compendium = registered ? await loadCompendium(registered.id) : null;

  return (
    <main className="min-h-[calc(100vh-130px)] w-full bg-surface-container-lowest pt-16">
      <div className="relative flex w-full flex-col">
        <PageBackdrop />

        <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col px-4 py-10 md:px-10 md:py-14">
          <Compendium
            dictionary={dictionary.compendium}
            confidants={dictionary.confidants}
            names={dictionary.profile.character.names}
            locale={locale}
            stats={compendium?.stats ?? null}
            chosen={registered?.character ?? null}
            achievements={compendium?.achievements ?? null}
            owner={null}
          />
        </div>
      </div>
    </main>
  );
}
