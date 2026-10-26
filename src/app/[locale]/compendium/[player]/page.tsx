import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageBackdrop } from "@/components/layout/page-backdrop";
import { Compendium } from "@/features/compendium/components/compendium";
import { loadCompendium } from "@/features/compendium/load-compendium";
import { getDictionary } from "@/i18n/dictionaries";
import { formatMessage } from "@/i18n/format";
import { isLocale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";
import { uuidSchema } from "@/lib/schemas";
import { getRegisteredPlayer } from "@/lib/users";

type Params = { params: Promise<{ locale: string; player: string }> };

/** The player in the URL, or null when the id is invalid or not a registered player. */
async function findPlayer(id: string) {
  const parsed = uuidSchema.safeParse(id);
  return parsed.success ? getRegisteredPlayer(parsed.data) : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, player } = await params;
  if (!isLocale(locale)) return {};

  const [{ compendium, metadata }, owner] = await Promise.all([getDictionary(locale), findPlayer(player)]);
  return owner ? { title: `${formatMessage(compendium.ownerTitle, { name: owner.username })} - ${metadata.title}` } : {};
}

/** Another registered player's compendium, read only (opened from the leaderboard). */
export default async function PlayerCompendiumPage({ params }: Params) {
  const { locale, player } = await params;
  if (!isLocale(locale)) notFound();

  const [dictionary, owner, user] = await Promise.all([getDictionary(locale), findPlayer(player), getCurrentUser()]);
  if (!owner) notFound();
  // Your own compendium is the one you can play cards from.
  if (user?.id === player) redirect(`/${locale}/compendium`);
  const { stats, achievements } = await loadCompendium(player);

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
            stats={stats}
            chosen={owner.character}
            achievements={achievements}
            owner={owner.username}
          />
        </div>
      </div>
    </main>
  );
}
