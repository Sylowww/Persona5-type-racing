import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageBackdrop } from "@/components/layout/page-backdrop";
import { CharacterFile } from "@/features/characters/components/character-file";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";
import { isCharacterId } from "@/lib/characters";

type Params = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale) || !isCharacterId(id)) return {};

  const { characters, profile, metadata } = await getDictionary(locale);
  return { title: `${profile.character.names[id]} - ${characters.metaTitle} - ${metadata.title}` };
}

export default async function CharacterPage({ params }: Params) {
  const { locale, id } = await params;
  if (!isLocale(locale) || !isCharacterId(id)) notFound();

  const [dictionary, user] = await Promise.all([getDictionary(locale), getCurrentUser()]);

  return (
    <main className="min-h-[calc(100vh-130px)] w-full bg-surface-container-lowest pt-16">
      <div className="relative flex w-full flex-col">
        <PageBackdrop />

        <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col px-4 py-10 md:px-10">
          <CharacterFile
            dictionary={dictionary.characters}
            names={dictionary.profile.character.names}
            locale={locale}
            initialId={id}
            titleSuffix={` - ${dictionary.characters.metaTitle} - ${dictionary.metadata.title}`}
            chosen={user?.kind === "registered" ? user.character : null}
          />
        </div>
      </div>
    </main>
  );
}
