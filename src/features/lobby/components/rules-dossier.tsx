import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { locales } from "@/i18n/locales";
import { raceModes, timeLimitOptions } from "@/lib/race-settings";
import type { LobbyVisibility, RaceSettings } from "@/types/lobby";
import { KeySoundPicker } from "./key-sound-picker";

type RulesDossierProps = {
  dictionary: Dictionary["lobby"]["rules"];
  settings: RaceSettings;
  /** The host edits the rules while the lobby is waiting; everyone else only sees them. */
  canEdit: boolean;
  isPending: boolean;
  onChange: (change: Partial<RaceSettings>) => void;
  /** Custom lobbies only; null hides the access choice (quick and training lobbies are always private). */
  visibility: LobbyVisibility | null;
  onVisibilityChange: (visibility: LobbyVisibility) => void;
  spectators: readonly string[];
  /** Shows a close button in the title (when the dossier is in the settings panel). */
  onClose?: () => void;
};

const visibilities: readonly LobbyVisibility[] = ["private", "public"];

export function timeLimitLabel(dictionary: Dictionary["lobby"]["rules"]["time"], seconds: number | null): string {
  if (seconds === null) return dictionary.unlimited;
  return seconds < 60 ? formatMessage(dictionary.seconds, { count: seconds }) : formatMessage(dictionary.minutes, { count: seconds / 60 });
}

export function RulesDossier({
  dictionary,
  settings,
  canEdit,
  isPending,
  onChange,
  visibility,
  onVisibilityChange,
  spectators,
  onClose,
}: RulesDossierProps) {
  const { mode, time, text } = dictionary;
  const disabled = !canEdit || isPending;
  const textRules = [
    { key: "numbers", label: text.numbers, enabled: settings.numbers },
    { key: "caseSensitive", label: text.casing, enabled: settings.caseSensitive },
  ] as const;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex rotate-1 items-center justify-between bg-secondary-fixed px-4 py-2 text-on-secondary-fixed shadow-hard-md">
        <span className="font-hud text-headline-sm font-black uppercase italic tracking-wider">{dictionary.title}</span>
        {onClose ? (
          <button type="button" onClick={onClose} aria-label={dictionary.close} className="flex items-center hover:scale-110">
            <Icon name="close" size={22} />
          </button>
        ) : (
          <Icon name="assignment" size={20} />
        )}
      </h2>

      <div className="flex flex-col gap-4 bg-surface-container p-4 shadow-hard-xl">
        {!canEdit && <p className="text-[12px] italic text-on-surface-variant">{dictionary.hostOnly}</p>}

        {visibility && (
          <>
            <div className="flex flex-col gap-1">
              <DirectiveTitle title={dictionary.visibility.title} tag={dictionary.visibility[visibility]} />
              <div className="grid grid-cols-2 gap-2">
                {visibilities.map((option) => {
                  const isActive = option === visibility;
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={isActive}
                      disabled={disabled}
                      onClick={() => onVisibilityChange(option)}
                      className={`flex items-center justify-center gap-1.5 p-2 font-hud text-[12px] font-black uppercase transition-transform enabled:hover:-translate-y-0.5 ${
                        isActive ? "bg-primary-container text-secondary-fixed shadow-hard-xs" : "bg-surface-container-low text-outline enabled:hover:text-secondary"
                      }`}
                    >
                      <Icon name={option === "private" ? "lock" : "visibility"} size={16} />
                      {dictionary.visibility[option]}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[12px] italic text-on-surface-variant">
                {visibility === "private" ? dictionary.visibility.privateHint : dictionary.visibility.publicHint}
              </p>
            </div>

            <hr className="border-surface-container-highest" />
          </>
        )}

        <div className="flex flex-col gap-1">
          <DirectiveTitle title={mode.title} tag={dictionary.hostEdits} />
          <div className="grid grid-cols-2 gap-2">
            {raceModes.map((option) => {
              const isActive = option === settings.mode;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={isActive}
                  disabled={disabled}
                  onClick={() => onChange({ mode: option })}
                  className={`p-2 text-center transition-transform enabled:hover:-translate-y-0.5 ${
                    isActive ? "bg-primary-container shadow-hard-xs" : "bg-surface-container-low opacity-70 enabled:hover:opacity-100"
                  }`}
                >
                  <span className={`block font-hud text-[11px] font-black uppercase ${isActive ? "text-secondary-fixed" : "text-outline"}`}>
                    {mode[option]}
                  </span>
                  <span className={`font-hud text-[13px] font-black ${option === "suddenDeath" ? "text-error" : "text-secondary"}`}>
                    {mode[`${option}Value`]}
                  </span>
                </button>
              );
            })}
          </div>
          {settings.mode === "suddenDeath" && <p className="mt-1 text-[12px] italic text-on-surface-variant">{mode.note}</p>}
          <ToggleRow label={mode.powers} enabled={settings.powers} disabled={disabled} dictionary={text} onToggle={() => onChange({ powers: !settings.powers })} />
          <p className="text-[12px] italic text-outline">{mode.powersSoon}</p>
        </div>

        <hr className="border-surface-container-highest" />

        <div className="flex flex-col gap-1">
          <DirectiveTitle title={time.title} tag={timeLimitLabel(time, settings.timeLimitSec)} />
          <div className="grid grid-cols-5 gap-1">
            {timeLimitOptions.map((option) => {
              const isActive = option === settings.timeLimitSec;
              return (
                <button
                  key={option ?? "none"}
                  type="button"
                  aria-pressed={isActive}
                  disabled={disabled}
                  onClick={() => onChange({ timeLimitSec: option })}
                  className={`px-1 py-1.5 font-hud text-[12px] font-black uppercase ${
                    isActive ? "bg-primary-container text-secondary-fixed shadow-hard-xs" : "bg-surface-container-low text-outline enabled:hover:text-secondary"
                  }`}
                >
                  {timeLimitLabel(time, option)}
                </button>
              );
            })}
          </div>
        </div>

        <hr className="border-surface-container-highest" />

        <div className="flex flex-col gap-1">
          <DirectiveTitle title={text.title} tag={settings.numbers ? "0-9" : "A-Z"} />
          <div role="group" aria-label={text.language} className="grid grid-cols-2 gap-2">
            {locales.map((option) => {
              const isActive = option === settings.language;
              return (
                <button
                  key={option}
                  type="button"
                  lang={option}
                  aria-pressed={isActive}
                  disabled={disabled}
                  onClick={() => onChange({ language: option })}
                  className={`flex items-center justify-center gap-1.5 p-2 font-hud text-[12px] font-black uppercase transition-transform enabled:hover:-translate-y-0.5 ${
                    isActive ? "bg-primary-container text-secondary-fixed shadow-hard-xs" : "bg-surface-container-low text-outline enabled:hover:text-secondary"
                  }`}
                >
                  <Icon name="translate" size={16} />
                  {text.languages[option]}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-1.5 bg-surface-container-low p-2">
            {textRules.map((rule) => (
              <ToggleRow
                key={rule.key}
                label={rule.label}
                enabled={rule.enabled}
                disabled={disabled}
                dictionary={text}
                onToggle={() => onChange({ [rule.key]: !rule.enabled })}
              />
            ))}
          </div>
        </div>

        <hr className="border-surface-container-highest" />

        <KeySoundPicker dictionary={dictionary.audio} />

        <hr className="border-surface-container-highest" />

        <div className="flex items-center justify-between gap-2 bg-surface-container-lowest p-2">
          <div className="flex items-center gap-2">
            <Icon name="visibility" size={20} className="text-secondary-fixed" />
            <div className="flex flex-col">
              <span className="font-hud text-[11px] font-black uppercase text-secondary">
                {formatMessage(dictionary.spectators, { count: spectators.length })}
              </span>
              <span className="text-[12px] text-outline">{spectators.join(", ")}</span>
            </div>
          </div>
          {/* Spectator mode does not exist yet. */}
          <button
            type="button"
            className="shrink-0 bg-surface-container px-2 py-1 font-hud text-[11px] font-black uppercase text-on-surface-variant hover:text-secondary"
          >
            {dictionary.inviteObserver}
          </button>
        </div>
      </div>
    </section>
  );
}

type ToggleRowProps = {
  label: string;
  enabled: boolean;
  disabled: boolean;
  dictionary: Dictionary["lobby"]["rules"]["text"];
  onToggle: () => void;
};

function ToggleRow({ label, enabled, disabled, dictionary, onToggle }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-on-surface">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        disabled={disabled}
        onClick={onToggle}
        className={`min-w-14 px-2 py-0.5 font-hud text-[13px] font-black uppercase ${
          enabled ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-surface-container-high text-outline"
        } enabled:hover:-translate-y-0.5 disabled:cursor-default`}
      >
        {enabled ? dictionary.on : dictionary.off}
      </button>
    </div>
  );
}

function DirectiveTitle({ title, tag }: { title: string; tag: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="font-hud text-[11px] font-black uppercase tracking-widest text-primary">{title}</h3>
      <span className="font-hud text-[11px] font-black uppercase text-secondary-fixed">{tag}</span>
    </div>
  );
}
