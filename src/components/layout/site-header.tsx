import { BrandWordmark } from "@/components/layout/brand-wordmark";
import { SiteNav } from "@/components/layout/site-nav";
import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import type { PlayerProfile, ServerStatus } from "@/types/player";

type SiteHeaderProps = {
  locale: Locale;
  dictionary: Dictionary["header"];
  player: PlayerProfile;
  server: ServerStatus;
};

export function SiteHeader({ locale, dictionary, player, server }: SiteHeaderProps) {
  const onlineCount = new Intl.NumberFormat(locale).format(server.onlineCount);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-surface-container-lowest/95 backdrop-blur-md">
      <div className="flex h-20 w-full items-center justify-between gap-4 px-4 md:px-10">
        <div className="flex shrink-0 flex-col -space-y-1">
          <BrandWordmark className="tracking-wider text-secondary" />
          <span className="font-hud text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            {dictionary.tagline}
          </span>
        </div>

        <SiteNav locale={locale} dictionary={dictionary} />

        <div className="flex shrink-0 items-center gap-4">
          <div className="hidden items-center gap-2 bg-surface-container-high px-2 py-1 2xl:flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-secondary-fixed opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-secondary-fixed" />
            </span>
            <span className="font-hud text-label-hud font-black uppercase tracking-widest text-on-surface-variant">
              {formatMessage(dictionary.server, { server: server.name, count: onlineCount })}
            </span>
          </div>

          <button
            type="button"
            aria-label={dictionary.sound}
            className="flex size-9 items-center justify-center bg-surface-container text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <Icon name="volume_up" size={20} />
          </button>

          <div className="flex items-center gap-2 bg-surface-container px-2 py-1">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary">
              <Icon name="person" size={18} className="text-on-primary" />
            </div>
            <div className="hidden flex-col sm:flex">
              <div className="flex items-center gap-1">
                <span className="font-hud text-label-hud font-black uppercase text-secondary-fixed">
                  {formatMessage(dictionary.level, { level: player.level })}
                </span>
                <span className="max-w-[90px] truncate font-body text-body-md font-bold text-secondary">
                  {player.name}
                </span>
              </div>
              <span className="font-hud text-[11px] font-black leading-none tracking-widest text-primary-container">
                {formatMessage(dictionary.wpm, { wpm: player.recordWpm })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
