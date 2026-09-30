import { PlayerAvatar } from "@/components/ui/player-avatar";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import type { User } from "@/types/user";

type ProfileCardProps = {
  locale: Locale;
  dictionary: Dictionary["profile"];
  user: User;
};

export function ProfileCard({ locale, dictionary, user }: ProfileCardProps) {
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(user.createdAt);

  return (
    <section className="relative">
      <div className="absolute -inset-1 translate-x-3 translate-y-3 rotate-[-1deg] bg-primary-container" />
      <div className="relative flex flex-col items-start gap-6 bg-surface-container-high p-6 shadow-hard-xl sm:flex-row sm:items-center md:p-8">
        <span className="absolute -top-4 left-6 rotate-[-3deg] bg-secondary-fixed px-3 py-1 font-hud text-label-hud font-black uppercase tracking-widest text-on-secondary-fixed shadow-hard-xs">
          {formatMessage(dictionary.tape, { id: user.id.replace(/-/g, "").slice(0, 4).toUpperCase() })}
        </span>
        <PlayerAvatar
          avatarUrl={user.avatarUrl}
          alt={formatMessage(dictionary.avatarAlt, { name: user.username })}
          size={144}
          className="rotate-[2deg] shadow-hard-lg shadow-secondary"
        />
        <div className="flex min-w-0 flex-col gap-2">
          <span className="w-fit -skew-x-6 bg-primary-container px-2 py-0.5 font-hud text-label-hud font-black uppercase text-on-primary-container">
            {dictionary.registered}
          </span>
          <h1 className="break-all font-display text-headline-md uppercase italic tracking-wider text-secondary md:text-headline-lg">
            {user.username}
          </h1>
          <p className="font-hud text-label-hud font-bold uppercase tracking-widest text-on-surface-variant">
            {formatMessage(dictionary.memberSince, { date })}
          </p>
        </div>
      </div>
    </section>
  );
}
