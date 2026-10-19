"use client";

import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import type { LobbyInvite } from "@/types/lobby";
import { useCopyText } from "../use-copy-text";

type InvitePanelProps = {
  dictionary: Dictionary["lobby"]["invites"];
  locale: Locale;
  invites: readonly LobbyInvite[];
  isPending: boolean;
  onCreate: () => void;
};

/** Host only: one invite link per guest (SALLE-04), with its status. */
export function InvitePanel({ dictionary, locale, invites, isPending, onCreate }: InvitePanelProps) {
  return (
    <section aria-labelledby="lobby-invites-title" className="flex flex-col gap-3 bg-surface-container p-4 shadow-hard-xl">
      <div className="flex items-center justify-between gap-2">
        <h2 id="lobby-invites-title" className="flex items-center gap-2 font-hud text-label-hud font-black uppercase tracking-widest text-secondary">
          <Icon name="link" size={18} className="text-primary-container" />
          {dictionary.title}
        </h2>
        <button
          type="button"
          onClick={onCreate}
          disabled={isPending}
          className="flex -skew-x-6 items-center gap-1 bg-primary-container px-3 py-1 font-hud text-[12px] font-black uppercase italic text-on-primary-container shadow-hard-xs transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-60"
        >
          <Icon name="add" size={16} className="skew-x-6" />
          <span className="skew-x-6">{dictionary.create}</span>
        </button>
      </div>
      <p className="text-[12px] italic text-on-surface-variant">{dictionary.hint}</p>
      {invites.length > 0 && (
        <ol className="flex flex-col gap-2">
          {invites.map((invite, index) => (
            <InviteRow key={invite.token} dictionary={dictionary} locale={locale} invite={invite} number={index + 1} />
          ))}
        </ol>
      )}
    </section>
  );
}

function InviteRow({ dictionary, locale, invite, number }: { dictionary: InvitePanelProps["dictionary"]; locale: Locale; invite: LobbyInvite; number: number }) {
  const path = `/${locale}/invite/${invite.token}`;
  // The origin is only known in the browser; the server render copies a relative link until then.
  const url = typeof window === "undefined" ? path : `${window.location.origin}${path}`;
  const { copied, copy } = useCopyText(url);
  const status = invite.isRevoked
    ? dictionary.revoked
    : invite.usedBy
      ? formatMessage(dictionary.usedBy, { name: invite.usedBy })
      : dictionary.unused;

  return (
    <li className="flex items-center justify-between gap-2 bg-surface-container-low px-3 py-2">
      <div className="flex min-w-0 flex-col">
        <span className="font-hud text-[11px] font-black uppercase text-secondary-fixed">{formatMessage(dictionary.link, { number })}</span>
        <code className="truncate text-[11px] text-outline" title={path}>
          {path}
        </code>
        <span className={`truncate text-[12px] ${invite.isRevoked ? "text-error line-through" : "text-on-surface-variant"}`}>{status}</span>
      </div>
      {!invite.isRevoked && (
        <button
          type="button"
          onClick={copy}
          aria-label={formatMessage(dictionary.copy, { number })}
          className="flex shrink-0 items-center gap-1 bg-surface-container px-2 py-1 font-hud text-[11px] font-black uppercase text-secondary transition-colors hover:bg-surface-container-high"
        >
          <Icon name={copied ? "check" : "content_copy"} size={16} />
          <span aria-live="polite">{copied ? dictionary.copied : dictionary.copyShort}</span>
        </button>
      )}
    </li>
  );
}
