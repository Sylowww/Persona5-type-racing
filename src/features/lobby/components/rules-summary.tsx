import { Icon, type IconName } from "@/components/ui/icon";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { LobbyVisibility, RaceSettings } from "@/types/lobby";
import { timeLimitLabel } from "./rules-dossier";

type RulesSummaryProps = {
  dictionary: Dictionary["lobby"]["rules"];
  settings: RaceSettings;
  /** Null for quick and training lobbies, which are always private. */
  visibility: LobbyVisibility | null;
  canEdit: boolean;
  onOpen: () => void;
};

type Chip = { key: string; icon: IconName; label: string; tone?: "danger" | "off" };

/** The host's rules at a glance, for every player; the button opens the settings panel. */
export function RulesSummary({ dictionary, settings, visibility, canEdit, onOpen }: RulesSummaryProps) {
  const { mode, text, time } = dictionary;
  const onOff = (enabled: boolean) => (enabled ? text.on : text.off);
  const chips: Chip[] = [
    ...(visibility ? [{ key: "visibility", icon: (visibility === "private" ? "lock" : "visibility") as IconName, label: dictionary.visibility[visibility] }] : []),
    { key: "mode", icon: "swords", label: mode[settings.mode], tone: settings.mode === "suddenDeath" ? "danger" : undefined },
    { key: "time", icon: "timer", label: timeLimitLabel(time, settings.timeLimitSec) },
    { key: "language", icon: "translate", label: text.languages[settings.language] },
    { key: "numbers", icon: "pin", label: `${text.numbers} ${onOff(settings.numbers)}`, tone: settings.numbers ? undefined : "off" },
    { key: "casing", icon: "keyboard", label: `${text.casing} ${onOff(settings.caseSensitive)}`, tone: settings.caseSensitive ? undefined : "off" },
    { key: "powers", icon: "bolt", label: `${mode.powers} ${onOff(settings.powers)}`, tone: settings.powers ? undefined : "off" },
  ];

  return (
    <section aria-label={dictionary.summary.title} className="flex flex-col gap-3 bg-surface-container p-4 shadow-hard-xl shadow-secondary-fixed">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 truncate font-hud text-[18px] font-black uppercase italic tracking-wider text-secondary">
          <Icon name="assignment" size={20} className="text-secondary-fixed" />
          {dictionary.summary.title}
        </h2>
        <button
          type="button"
          onClick={onOpen}
          className="flex -skew-x-6 items-center gap-1 bg-secondary-fixed px-3 py-1 font-hud text-label-hud font-black uppercase italic text-on-secondary-fixed shadow-hard-xs hover:-translate-y-0.5"
        >
          <Icon name="tune" size={16} />
          {canEdit ? dictionary.summary.edit : dictionary.summary.view}
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li
            key={chip.key}
            className={`flex -skew-x-6 items-center gap-1.5 px-2 py-1 font-hud text-[12px] font-black uppercase ${
              chip.tone === "danger"
                ? "bg-primary-container text-on-primary-container"
                : chip.tone === "off"
                  ? "bg-surface-container-low text-outline"
                  : "bg-surface-container-highest text-secondary"
            }`}
          >
            <Icon name={chip.icon} size={14} />
            {chip.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
