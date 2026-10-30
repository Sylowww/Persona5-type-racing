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
    // A confidential file: taped label, mugshot in a tilted frame, stats on stuck-on plates and a red radar backdrop.
    <section className="relative flex flex-col gap-7 border-4 border-secondary bg-surface-container-lowest px-6 pt-10 pb-6 shadow-[10px_10px_0_var(--color-primary-container)] sm:px-8">
      <div aria-hidden="true" className="halftone pointer-events-none absolute top-0 right-0 h-24 w-1/2 bg-primary-container [clip-path:polygon(30%_0,100%_0,100%_100%)]" />
      <span className="absolute -top-4 left-5 -rotate-2 bg-secondary-fixed px-3 py-1 font-hud text-label-hud font-black uppercase tracking-widest text-on-secondary-fixed shadow-hard-sm">
        {user ? formatMessage(dictionary.tape, { id: dossierId(user.id) }) : dictionary.guest.tape}
      </span>

      <div className="relative flex items-center gap-5">
        <div className="shrink-0 -rotate-3 bg-secondary p-1.5 shadow-[5px_5px_0_var(--color-primary-container)]">
          <PlayerAvatar avatarUrl={user?.avatarUrl ?? null} alt={dictionary.avatarAlt} size={80} />
        </div>
        {user ? (
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="truncate font-display text-[clamp(32px,3.4vw,44px)] uppercase italic leading-none tracking-wider text-secondary [text-shadow:3px_3px_0_var(--color-primary-container)]">{user.username}</h2>
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
            <h2 className="font-display text-[clamp(28px,3vw,40px)] uppercase italic leading-none tracking-wider text-secondary [text-shadow:3px_3px_0_var(--color-primary-container)]">
              {dictionary.guest.title}
            </h2>
            <p className="text-on-surface-variant">{dictionary.guest.text}</p>
            <div className="mt-1 flex flex-wrap items-center gap-4">
              <Link
                href={`/${locale}/sign-up`}
                className="-skew-x-12 bg-primary-container px-3 py-1.5 shadow-hard-sm font-hud text-label-hud font-black uppercase tracking-wider text-on-primary-container transition-colors hover:bg-secondary-fixed hover:text-on-secondary-fixed"
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
