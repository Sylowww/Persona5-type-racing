import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import type { LeaderboardEntry, PlayerProfile } from "@/types/player";
import { KeyAudioToggle } from "./key-audio-toggle";
import { RivalLeaderboard } from "./rival-leaderboard";
import { SkillRadar } from "./skill-radar";
import { StatTile } from "./stat-tile";

type PlayerDossierProps = {
  locale: Locale;
  dictionary: Dictionary["home"]["dossier"];
  player: PlayerProfile;
  leaderboard: readonly LeaderboardEntry[];
};

export function PlayerDossier({ locale, dictionary, player, leaderboard }: PlayerDossierProps) {
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });

  return (
    <section className="relative">
      <div className="absolute -inset-1 translate-x-3 translate-y-3 rotate-[1.5deg] bg-surface-container-lowest" />
      <div className="absolute -top-3 left-6 z-20 rotate-[-4deg] bg-secondary-fixed/90 px-4 py-0.5 font-hud text-label-hud font-black uppercase text-on-secondary-fixed shadow-hard-xs">
        {formatMessage(dictionary.tape, { id: player.dossierId })}
      </div>
      <div className="absolute -top-2 -right-2 z-20 flex size-8 rotate-12 items-center justify-center bg-primary-container text-secondary shadow-hard-xs">
        <Icon name="push_pin" size={18} />
      </div>

      <div className="relative flex flex-col gap-4 bg-surface-container p-4 shadow-hard-xl shadow-primary-container sm:p-7">
        <div className="flex rotate-[-1deg] items-center gap-4 bg-surface-container-lowest p-4 shadow-hard-md shadow-secondary">
          {/* Avatar placeholder until players can upload one. */}
          <div
            role="img"
            aria-label={dictionary.avatarAlt}
            className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden bg-primary-container shadow-hard-sm shadow-secondary-fixed"
          >
            <Icon name="person" filled size={64} className="text-on-primary-container" />
            <span className="absolute right-0 bottom-0 bg-secondary px-1 font-hud text-[12px] font-black text-surface-container-lowest">
              {formatMessage(dictionary.level, { level: player.level })}
            </span>
          </div>
          <div className="flex min-w-0 flex-col justify-center">
            <div className="flex flex-wrap items-center gap-1">
              <span className="bg-primary-container px-2 py-0.5 font-hud text-[11px] font-black uppercase text-on-primary-container">
                {dictionary.codename}
              </span>
              <span className="bg-secondary-fixed px-2 py-0.5 font-hud text-[11px] font-black uppercase text-on-secondary-fixed">
                {formatMessage(dictionary.rank, { rank: player.rank })}
              </span>
            </div>
            <h2 className="mt-1 truncate font-display text-headline-md uppercase italic tracking-wider text-secondary">{player.name}</h2>
            <span className="font-hud text-label-hud font-bold uppercase tracking-widest text-on-surface-variant">
              {formatMessage(dictionary.syndicate, { name: player.syndicate })}
            </span>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-1">
          <StatTile
            label={dictionary.stats.record}
            value={number.format(player.recordWpm)}
            note={formatMessage(dictionary.stats.recordNote, { percent: number.format(player.topPercent) })}
            valueColor="text-primary-container"
            noteColor="text-secondary-fixed"
          />
          <StatTile
            label={dictionary.stats.accuracy}
            value={percent.format(player.accuracy / 100)}
            note={dictionary.stats.accuracyNote}
            valueColor="text-secondary"
            noteColor="text-primary-fixed"
          />
          <StatTile
            label={dictionary.stats.streak}
            value={formatMessage(dictionary.stats.streakValue, { count: player.winStreak })}
            note={dictionary.stats.streakNote}
            valueColor="text-secondary-fixed"
            noteColor="text-tertiary"
          />
        </dl>

        <SkillRadar dictionary={dictionary.radar} radar={player.radar} sync={player.radarSync} />
        <RivalLeaderboard dictionary={dictionary.leaderboard} entries={leaderboard} />
        <KeyAudioToggle dictionary={dictionary.keyAudio} />
      </div>
    </section>
  );
}
