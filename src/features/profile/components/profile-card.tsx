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
    <section>
      <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center">
        <PlayerAvatar
          avatarUrl={user.avatarUrl}
          alt={formatMessage(dictionary.avatarAlt, { name: user.username })}
          size={144}
          className="shadow-hard-xl"
        />
        <div className="flex min-w-0 flex-col gap-2">
          <span className="eyebrow">
            {formatMessage(dictionary.tape, { id: user.id.replace(/-/g, "").slice(0, 4).toUpperCase() })}
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
