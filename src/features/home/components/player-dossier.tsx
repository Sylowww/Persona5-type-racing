import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import type { RadarValue } from "@/types/player";
import type { PlayerStats } from "@/types/race";
import type { User } from "@/types/user";
import { DossierStats } from "./dossier-stats";
import { GuestDossierStats } from "./guest-dossier-stats";
import { GuestSkillRadar } from "./guest-skill-radar";
import { RadarEmpty, SkillRadar } from "./skill-radar";

type PlayerDossierProps = {
  locale: Locale;
  dictionary: Dictionary["home"]["dossier"];
  /** Signed-in registered user, or null for visitors and guests. */
  user: User | null;
  /** Saved stats of the registered user; guests' stats are read from their browser tab. */
  stats: PlayerStats | null;
  /** Skill radar of the registered user from their saved races; null without races. */
  radar: RadarValue[] | null;
};

export function PlayerDossier({ locale, dictionary, user, stats, radar }: PlayerDossierProps) {
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long" });

  return (
    <section className="panel flex flex-col gap-6 p-6 sm:p-8">
      <span className="eyebrow">{user ? formatMessage(dictionary.tape, { id: dossierId(user.id) }) : dictionary.guest.tape}</span>

      <div className="flex items-center gap-5">
        <PlayerAvatar avatarUrl={user?.avatarUrl ?? null} alt={dictionary.avatarAlt} size={80} className="shrink-0" />
        {user ? (
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="truncate font-display text-headline-md uppercase italic tracking-wider text-secondary">{user.username}</h2>
            <span className="text-sm text-on-surface-variant">
              {formatMessage(dictionary.memberSince, { date: date.format(user.createdAt) })}
            </span>
            <Link
              href={`/${locale}/profile`}
              className="mt-1 flex w-fit items-center gap-1 font-hud text-label-hud font-black uppercase tracking-widest text-secondary-fixed hover:text-secondary"
            >
              {dictionary.viewProfile}
              <Icon name="arrow_forward" size={16} />
            </Link>
          </div>
        ) : (
          <div className="flex min-w-0 flex-col gap-2">
            <h2 className="font-display text-headline-sm uppercase italic tracking-wider text-secondary md:text-headline-md">
              {dictionary.guest.title}
            </h2>
            <p className="text-on-surface-variant">{dictionary.guest.text}</p>
            <div className="mt-1 flex flex-wrap items-center gap-4">
              <Link
                href={`/${locale}/sign-up`}
                className="bg-primary-container px-3 py-1.5 font-hud text-label-hud font-black uppercase tracking-wider text-on-primary-container transition-colors hover:bg-secondary-container hover:text-on-secondary-fixed"
              >
                {dictionary.guest.signUp}
              </Link>
              <Link
                href={`/${locale}/sign-in`}
                className="font-hud text-label-hud font-black uppercase tracking-wider text-secondary-fixed underline decoration-2 underline-offset-4 hover:text-secondary"
              >
                {dictionary.guest.signIn}
              </Link>
            </div>
          </div>
        )}
      </div>

      {user && stats ? (
        <DossierStats dictionary={dictionary.stats} stats={stats} />
      ) : (
        <GuestDossierStats dictionary={dictionary.stats} sessionNote={dictionary.guest.sessionNote} />
      )}

      {!user ? (
        <GuestSkillRadar dictionary={dictionary.radar} />
      ) : radar ? (
        <SkillRadar dictionary={dictionary.radar} radar={radar} />
      ) : (
        <RadarEmpty dictionary={dictionary.radar} />
      )}
    </section>
  );
}

/** Short display id derived from the user id, e.g. "3F9A". */
function dossierId(userId: string): string {
  return userId.replace(/-/g, "").slice(0, 4).toUpperCase();
}
