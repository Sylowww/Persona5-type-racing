import Link from "next/link";
import { AccountMenu } from "@/components/layout/account-menu";
import { BrandWordmark } from "@/components/layout/brand-wordmark";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MusicPlayer } from "@/components/layout/music-player";
import { SiteNav } from "@/components/layout/site-nav";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import type { ServerStatus } from "@/types/player";
import type { User } from "@/types/user";

type SiteHeaderProps = {
  locale: Locale;
  dictionary: Dictionary["header"];
  user: User | null;
  server: ServerStatus;
};

export function SiteHeader({ locale, dictionary, user, server }: SiteHeaderProps) {
  const onlineCount = new Intl.NumberFormat(locale).format(server.onlineCount);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-surface-container-high bg-surface-container-lowest/90 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between gap-2 px-4 sm:gap-4 md:px-10">
        <div className="flex shrink-0 items-center gap-8 xl:gap-12">
          <Link href={`/${locale}`} className="shrink-0">
            <BrandWordmark className="text-headline-sm tracking-normal text-secondary sm:tracking-wider md:text-headline-md" />
          </Link>
          <SiteNav locale={locale} dictionary={dictionary} />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 px-2 py-1 min-[1800px]:flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-secondary-fixed opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-secondary-fixed" />
            </span>
            <span className="font-hud text-label-hud font-black uppercase tracking-widest text-on-surface-variant">
              {formatMessage(dictionary.server, { server: server.name, count: onlineCount })}
            </span>
          </div>

          <LanguageSwitcher locale={locale} dictionary={dictionary.language} />

          <MusicPlayer dictionary={dictionary.music} />

          <AccountMenu locale={locale} dictionary={dictionary.account} user={user} />
        </div>
      </div>
    </header>
  );
}
