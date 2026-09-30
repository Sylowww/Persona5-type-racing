import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import type { LeaderboardEntry } from "@/types/player";
import type { User } from "@/types/user";
import { KeyAudioToggle } from "./key-audio-toggle";
import { RivalLeaderboard } from "./rival-leaderboard";
import { StatTile } from "./stat-tile";

type PlayerDossierProps = {
  locale: Locale;
  dictionary: Dictionary["home"]["dossier"];
  /** Signed-in registered user, or null for visitors and guests. */
  user: User | null;
  leaderboard: readonly LeaderboardEntry[];
};

// Race results are not persisted yet, so every stat shows its empty state.
export function PlayerDossier({ locale, dictionary, user, leaderboard }: PlayerDossierProps) {
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long" });

  return (
    <section className="relative">
      <div className="absolute -inset-1 translate-x-3 translate-y-3 rotate-[1.5deg] bg-surface-container-lowest" />
      <div className="absolute -top-3 left-6 z-20 rotate-[-4deg] bg-secondary-fixed/90 px-4 py-0.5 font-hud text-label-hud font-black uppercase text-on-secondary-fixed shadow-hard-xs">
        {user ? formatMessage(dictionary.tape, { id: dossierId(user.id) }) : dictionary.guest.tape}
      </div>
      <div className="absolute -top-2 -right-2 z-20 flex size-8 rotate-12 items-center justify-center bg-primary-container text-secondary shadow-hard-xs">
        <Icon name="push_pin" size={18} />
      </div>

      <div className="relative flex flex-col gap-4 bg-surface-container p-4 shadow-hard-xl shadow-primary-container sm:p-7">
        <div className="flex rotate-[-1deg] items-center gap-4 bg-surface-container-lowest p-4 shadow-hard-md shadow-secondary">
          <PlayerAvatar
            avatarUrl={user?.avatarUrl ?? null}
            alt={dictionary.avatarAlt}
            size={96}
            className="shadow-hard-sm shadow-secondary-fixed"
          />
          {user ? (
            <div className="flex min-w-0 flex-col justify-center">
              <div className="flex flex-wrap items-center gap-1">
                <span className="bg-primary-container px-2 py-0.5 font-hud text-[11px] font-black uppercase text-on-primary-container">
                  {dictionary.codename}
                </span>
              </div>
              <h2 className="mt-1 truncate font-display text-headline-md uppercase italic tracking-wider text-secondary">
                {user.username}
              </h2>
              <span className="font-hud text-label-hud font-bold uppercase tracking-widest text-on-surface-variant">
                {formatMessage(dictionary.memberSince, { date: date.format(user.createdAt) })}
              </span>
              <Link
                href={`/${locale}/profile`}
                className="mt-1 flex w-fit items-center gap-1 font-hud text-label-hud font-black uppercase italic text-secondary-fixed hover:text-secondary"
              >
                {dictionary.viewProfile}
                <Icon name="arrow_forward" size={16} />
              </Link>
            </div>
          ) : (
            <div className="flex min-w-0 flex-col justify-center gap-1">
              <h2 className="font-display text-headline-sm uppercase italic tracking-wider text-secondary md:text-headline-md">
                {dictionary.guest.title}
              </h2>
              <p className="text-on-surface-variant">{dictionary.guest.text}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <Link
                  href={`/${locale}/sign-up`}
                  className="-skew-x-6 bg-primary-container px-3 py-1 font-hud text-label-hud font-black uppercase italic text-on-primary-container shadow-hard-sm shadow-secondary hover:bg-secondary-container hover:text-on-secondary-fixed"
                >
                  {dictionary.guest.signUp}
                </Link>
                <Link
                  href={`/${locale}/sign-in`}
                  className="font-hud text-label-hud font-black uppercase text-secondary-fixed underline decoration-2 underline-offset-4 hover:text-secondary"
                >
                  {dictionary.guest.signIn}
                </Link>
              </div>
            </div>
          )}
        </div>

        <dl className="grid grid-cols-3 gap-1">
          <StatTile label={dictionary.stats.record} value="—" note={dictionary.stats.empty} valueColor="text-primary-container" noteColor="text-on-surface-variant" />
          <StatTile label={dictionary.stats.accuracy} value="—" note={dictionary.stats.empty} valueColor="text-secondary" noteColor="text-on-surface-variant" />
          <StatTile label={dictionary.stats.races} value="0" note={dictionary.stats.empty} valueColor="text-secondary-fixed" noteColor="text-on-surface-variant" />
        </dl>

        <section className="flex flex-col gap-2 bg-surface-container-lowest p-4 shadow-hard-sm shadow-surface-container-high">
          <h3 className="font-hud text-label-hud font-black uppercase tracking-widest text-secondary">{dictionary.radar.title}</h3>
          <p className="flex items-center gap-2 py-6 text-on-surface-variant">
            <Icon name="analytics" size={28} className="text-primary-container" />
            {dictionary.radar.empty}
          </p>
        </section>

        <RivalLeaderboard dictionary={dictionary.leaderboard} entries={leaderboard} />
        <KeyAudioToggle dictionary={dictionary.keyAudio} />
      </div>
    </section>
  );
}

/** Short display id derived from the user id, e.g. "3F9A". */
function dossierId(userId: string): string {
  return userId.replace(/-/g, "").slice(0, 4).toUpperCase();
}
