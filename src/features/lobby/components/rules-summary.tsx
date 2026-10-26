import { Icon, type IconName } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
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

const visibilityIcons: Record<LobbyVisibility, IconName> = { public: "visibility", code: "key", private: "lock" };

type Chip = { key: string; icon: IconName; label: string; tone?: "danger" | "off" };

/** The host's rules at a glance, for every player; the button opens the settings panel. */
export function RulesSummary({ dictionary, settings, visibility, canEdit, onOpen }: RulesSummaryProps) {
  const { mode, text, time } = dictionary;
  const onOff = (enabled: boolean) => (enabled ? text.on : text.off);
  const chips: Chip[] = [
    ...(visibility ? [{ key: "visibility", icon: visibilityIcons[visibility], label: dictionary.visibility[visibility] }] : []),
    { key: "mode", icon: "swords", label: mode[settings.mode], tone: settings.mode === "suddenDeath" ? "danger" : undefined },
    { key: "time", icon: "timer", label: timeLimitLabel(time, settings.timeLimitSec) },
    { key: "language", icon: "translate", label: text.languages[settings.language] },
    { key: "textType", icon: "assignment", label: `${text.types[settings.textType]} · ${formatMessage(text.words, { count: settings.wordCount })}` },
    { key: "complexity", icon: "speed", label: `${text.complexity} ${text.complexities[settings.complexity]}` },
    { key: "numbers", icon: "pin", label: `${text.numbers} ${onOff(settings.numbers)}`, tone: settings.numbers ? undefined : "off" },
    { key: "casing", icon: "keyboard", label: `${text.casing} ${onOff(settings.caseSensitive)}`, tone: settings.caseSensitive ? undefined : "off" },
    { key: "powers", icon: "bolt", label: `${mode.powers} ${onOff(settings.powers)}`, tone: settings.powers ? undefined : "off" },
  ];

  return (
    <section aria-label={dictionary.summary.title} className="panel flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="eyebrow min-w-0 truncate">
          {dictionary.summary.title}
        </h2>
        <button
          type="button"
          onClick={onOpen}
          className="btn-ghost shrink-0 px-3 py-1.5"
        >
          <Icon name="tune" size={16} />
          {canEdit ? dictionary.summary.edit : dictionary.summary.view}
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li
            key={chip.key}
            className={`flex items-center gap-1.5 border px-2 py-1 font-hud text-[12px] font-black uppercase ${
              chip.tone === "danger"
                ? "border-primary-container text-primary"
                : chip.tone === "off"
                  ? "border-surface-container-high text-on-surface-variant"
                  : "border-surface-container-highest text-secondary"
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
