"use client";

import { Icon, type IconName } from "@/components/ui/icon";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import { CloseLobbyButton } from "./close-lobby-button";

type LobbyActionsProps = {
  dictionary: Dictionary["lobby"]["actions"];
  canStart: boolean;
  isHost: boolean;
  isReady: boolean;
  /** Spectators do not ready up; they may take a seat back. */
  isSpectator: boolean;
  /** Switches between racing and spectating; null when not allowed (quick and training lobbies, during a race). */
  onToggleRole: (() => void) | null;
  isPending: boolean;
  onToggleReady: () => void;
  onStart: () => void;
  onLeave: () => void;
  onShowSettings: () => void;
  onShowChat: () => void;
  /** Set for the host of a custom lobby outside a race. */
  close: { code: string; locale: Locale } | null;
};

export function LobbyActions({
  dictionary,
  canStart,
  isHost,
  isReady,
  isSpectator,
  onToggleRole,
  isPending,
  onToggleReady,
  onStart,
  onLeave,
  onShowSettings,
  onShowChat,
  close,
}: LobbyActionsProps) {
  return (
    <div className="flex flex-col-reverse items-stretch justify-between gap-6 border-y border-surface-container-high py-6 lg:flex-row lg:items-center">
      <div className="flex flex-wrap items-center gap-2">
        {!isSpectator && (
          <button
            type="button"
            aria-pressed={isReady}
            onClick={onToggleReady}
            disabled={isPending}
            className={`flex items-center gap-2 border px-4 py-2 font-hud text-label-hud font-black uppercase tracking-wider transition-colors ${
              isReady
                ? "border-surface-container-highest text-secondary hover:border-secondary-fixed"
                : "border-secondary-fixed bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary hover:text-surface-container-lowest"
            }`}
          >
            <Icon name={isReady ? "close" : "check"} size={18} />
            <span>{isReady ? dictionary.unready : dictionary.ready}</span>
          </button>
        )}
        {onToggleRole && (
          <DockButton icon={isSpectator ? "sports_martial_arts" : "visibility"} label={isSpectator ? dictionary.play : dictionary.spectate} onClick={onToggleRole} />
        )}
        <DockButton icon="tune" label={dictionary.settings} onClick={onShowSettings} />
        <DockButton icon="chat" label={dictionary.chat} onClick={onShowChat} />
        <DockButton icon="close" label={dictionary.leave} danger onClick={onLeave} />
        {close && <CloseLobbyButton code={close.code} locale={close.locale} label={dictionary.close} confirmMessage={dictionary.closeConfirm} />}
      </div>

      <button
        type="button"
        disabled={!canStart || isPending}
        onClick={onStart}
        className="group flex shrink-0 items-center justify-center gap-4 bg-primary-container px-10 py-4 text-on-primary-container shadow-hard-xl transition-[transform,background-color] enabled:hover:-translate-y-1 disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:shadow-none"
      >
        <Icon name="play_arrow" size={32} filled />
        <span className="flex flex-col text-left">
          <span className="font-hud text-[11px] font-black uppercase leading-none tracking-widest">
            {canStart ? dictionary.eyebrow : isHost ? dictionary.waiting : dictionary.hostOnly}
          </span>
          <span className="mt-1 font-display text-headline-md uppercase italic leading-none tracking-wider">{dictionary.start}</span>
        </span>
      </button>
    </div>
  );
}

type DockButtonProps = { icon: IconName; label: string; danger?: boolean; onClick?: () => void };

function DockButton({ icon, label, danger = false, onClick }: DockButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn-ghost px-3 py-2 ${danger ? "text-error hover:bg-error-container hover:text-on-error-container" : ""}`}
    >
      <Icon name={icon} size={18} />
      <span>{label}</span>
    </button>
  );
}
