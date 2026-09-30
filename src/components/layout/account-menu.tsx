import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { signOut } from "@/features/auth/actions";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import type { User } from "@/types/user";

type AccountMenuProps = {
  locale: Locale;
  dictionary: Dictionary["header"]["account"];
  user: User | null;
};

export function AccountMenu({ locale, dictionary, user }: AccountMenuProps) {
  if (!user || user.kind === "guest") {
    return (
      <nav aria-label={dictionary.label} className="flex items-center gap-2">
        <Link
          href={`/${locale}/sign-in`}
          className="hidden px-2 py-1 font-hud text-label-hud font-black uppercase tracking-widest text-on-surface-variant hover:text-secondary sm:block xl:hidden min-[1800px]:block"
        >
          {dictionary.signIn}
        </Link>
        <Link
          href={`/${locale}/sign-up`}
          className="flex -skew-x-6 items-center gap-1 bg-primary-container px-3 py-1.5 font-hud text-label-hud font-black uppercase italic text-on-primary-container shadow-hard-sm shadow-secondary transition-colors hover:bg-secondary-container hover:text-on-secondary-fixed"
        >
          <Icon name="login" size={18} className="skew-x-6" />
          <span className="sr-only skew-x-6 sm:not-sr-only">{dictionary.signUp}</span>
        </Link>
      </nav>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/${locale}/profile`}
        className="flex items-center gap-2 bg-surface-container px-2 py-1 transition-colors hover:bg-surface-container-high"
      >
        <PlayerAvatar avatarUrl={user.avatarUrl} alt="" size={32} className="rounded-full" />
        <span className="sr-only sm:hidden">{dictionary.profile}</span>
        <div className="hidden flex-col sm:flex">
          <span className="font-hud text-[11px] font-black uppercase leading-none tracking-widest text-secondary-fixed">
            {dictionary.registered}
          </span>
          <span className="max-w-[120px] truncate font-body text-body-md font-bold text-secondary">{user.username}</span>
        </div>
      </Link>
      <form action={signOut}>
        <input type="hidden" name="locale" value={locale} />
        <button
          type="submit"
          aria-label={dictionary.signOut}
          title={dictionary.signOut}
          className="flex size-10 items-center justify-center bg-surface-container text-on-surface-variant transition-colors hover:bg-primary-container hover:text-on-primary-container"
        >
          <Icon name="logout" size={20} />
        </button>
      </form>
    </div>
  );
}
