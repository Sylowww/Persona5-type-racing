import { Icon, type IconName } from "@/components/ui/icon";
import type { Dictionary } from "@/i18n/dictionaries/en";

type LobbyActionsProps = {
  dictionary: Dictionary["lobby"]["actions"];
  canStart: boolean;
};

// Lobby settings, chat, leaving and starting are not wired to the server yet.
export function LobbyActions({ dictionary, canStart }: LobbyActionsProps) {
  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-6 pt-4 lg:flex-row">
      <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
        <DockButton icon="tune" label={dictionary.settings} />
        <DockButton icon="chat" label={dictionary.chat} />
        <DockButton icon="close" label={dictionary.leave} danger />
      </div>

      <div className="relative flex w-full justify-end lg:w-auto">
        {canStart && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-5 -left-4 z-20 -rotate-12 bg-secondary-fixed px-3 py-0.5 font-display text-[22px] uppercase italic text-on-secondary-fixed shadow-hard-sm"
          >
            {dictionary.badge}
          </span>
        )}
        <button
          type="button"
          disabled={!canStart}
          className="group relative w-full -skew-x-12 overflow-hidden bg-primary-container px-12 py-4 text-on-primary-container shadow-[8px_8px_0_var(--color-secondary-fixed)] transition-transform duration-200 enabled:hover:-translate-y-1 disabled:bg-surface-container-high disabled:shadow-hard-xl lg:w-auto"
        >
          <span className="relative z-10 flex skew-x-12 items-center justify-center gap-4">
            <Icon name="play_arrow" size={32} className="group-enabled:group-hover:motion-safe:animate-bounce" />
            <span className="flex flex-col text-left">
              <span className="font-hud text-[11px] font-black uppercase leading-none tracking-widest text-secondary-fixed">
                {canStart ? dictionary.eyebrow : dictionary.waiting}
              </span>
              <span className="mt-1 font-display text-headline-md uppercase italic leading-none tracking-wider text-secondary md:text-headline-lg">
                {dictionary.start}
              </span>
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

function DockButton({ icon, label, danger = false }: { icon: IconName; label: string; danger?: boolean }) {
  return (
    <button
      type="button"
      className={`flex -skew-x-6 items-center gap-2 bg-surface-container px-4 py-2 font-hud text-headline-sm font-black uppercase italic shadow-hard-sm transition-transform hover:-translate-y-0.5 ${
        danger ? "text-error hover:bg-error-container hover:text-on-error-container" : "text-secondary hover:bg-surface-container-high"
      }`}
    >
      <Icon name={icon} size={20} />
      <span>{label}</span>
    </button>
  );
}
