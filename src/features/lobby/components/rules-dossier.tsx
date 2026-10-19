import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { locales } from "@/i18n/locales";
import { lobbyVisibilities } from "@/lib/lobby";
import { MAX_CHAR_FILTER, raceModes, textComplexities, textTypes, timeLimitOptions, wordCountOptions } from "@/lib/race-settings";
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
  /** Seats of a custom lobby and the lowest allowed value; null hides the setting (quick and training lobbies). */
  seats: { capacity: number; min: number; max: number } | null;
  onCapacityChange: (capacity: number) => void;
  spectators: readonly string[];
  /** Shows a close button in the title (when the dossier is in the settings panel). */
  onClose?: () => void;
};

const visibilityIcons = { public: "visibility", code: "key", private: "lock" } as const;

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
  seats,
  onCapacityChange,
  spectators,
  onClose,
}: RulesDossierProps) {
  const { mode, time, text } = dictionary;
  const disabled = !canEdit || isPending;
  const textRules = [
    { key: "punctuation", label: text.punctuation, enabled: settings.punctuation },
    { key: "capitals", label: text.capitals, enabled: settings.capitals },
    // Accents only matter in French.
    ...(settings.language === "fr" ? [{ key: "accents", label: text.accents, enabled: settings.accents } as const] : []),
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
              <div className="grid grid-cols-3 gap-2">
                {lobbyVisibilities.map((option) => {
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
                      <Icon name={visibilityIcons[option]} size={16} />
                      {dictionary.visibility[option]}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[12px] italic text-on-surface-variant">
                {dictionary.visibility[`${visibility}Hint`]}
              </p>
            </div>

            {seats && (
              <div className="flex flex-col gap-1">
                <DirectiveTitle title={dictionary.seats.title} tag={formatMessage(dictionary.seats.value, { count: seats.capacity })} />
                <div className="flex items-center gap-2">
                  <SeatButton icon="remove" label={dictionary.seats.decrease} disabled={disabled || seats.capacity <= seats.min} onClick={() => onCapacityChange(seats.capacity - 1)} />
                  <output aria-live="polite" className="flex-1 bg-surface-container-low py-1.5 text-center font-display text-headline-sm italic text-secondary">
                    {seats.capacity}
                  </output>
                  <SeatButton icon="add" label={dictionary.seats.increase} disabled={disabled || seats.capacity >= seats.max} onClick={() => onCapacityChange(seats.capacity + 1)} />
                </div>
                <p className="mt-1 text-[12px] italic text-on-surface-variant">
                  {formatMessage(dictionary.seats.hint, { min: seats.min, max: seats.max })}
                </p>
              </div>
            )}

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
          <p className="text-[12px] italic text-outline">{mode.powersHint}</p>
        </div>

        <hr className="border-surface-container-highest" />

        <div className="flex flex-col gap-1">
          <DirectiveTitle title={time.title} tag={timeLimitLabel(time, settings.timeLimitSec)} />
          <div className="grid grid-cols-4 gap-1">
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
          <ChoiceRow
            label={text.type}
            options={textTypes.map((option) => ({ value: option, label: text.types[option] }))}
            value={settings.textType}
            disabled={disabled}
            onPick={(textType) => onChange({ textType })}
          />
          <ChoiceRow
            label={text.length}
            options={wordCountOptions.map((option) => ({ value: option, label: formatMessage(text.words, { count: option }) }))}
            value={settings.wordCount}
            disabled={disabled}
            onPick={(wordCount) => onChange({ wordCount })}
          />
          <ChoiceRow
            label={text.complexity}
            options={textComplexities.map((option) => ({ value: option, label: text.complexities[option] }))}
            value={settings.complexity}
            disabled={disabled}
            onPick={(complexity) => onChange({ complexity })}
          />
          <p className="text-[12px] italic text-on-surface-variant">{text.complexityHint}</p>
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

        {settings.textType === "random" && (
          <div className="flex flex-col gap-2">
            <CharFilter label={text.include} value={settings.includeChars} disabled={disabled} onSave={(includeChars) => onChange({ includeChars })} />
            <CharFilter label={text.exclude} value={settings.excludeChars} disabled={disabled} onSave={(excludeChars) => onChange({ excludeChars })} />
            <p className="text-[12px] italic text-on-surface-variant">{text.filterHint}</p>
          </div>
        )}

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
        </div>
      </div>
    </section>
  );
}

function SeatButton({ icon, label, disabled, onClick }: { icon: "add" | "remove"; label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-9 items-center justify-center bg-surface-container-low text-secondary transition-transform enabled:hover:-translate-y-0.5 enabled:hover:bg-primary-container disabled:opacity-40"
    >
      <Icon name={icon} size={20} />
    </button>
  );
}

type ChoiceRowProps<T extends string | number> = {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  disabled: boolean;
  onPick: (value: T) => void;
};

function ChoiceRow<T extends string | number>({ label, options, value, disabled, onPick }: ChoiceRowProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1">
      <span className="font-hud text-[11px] font-black uppercase text-outline">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              disabled={disabled}
              onClick={() => onPick(option.value)}
              className={`flex-1 px-2 py-1.5 font-hud text-[12px] font-black uppercase ${
                isActive ? "bg-primary-container text-secondary-fixed shadow-hard-xs" : "bg-surface-container-low text-outline enabled:hover:text-secondary"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Letters field saved when it loses focus or on Enter; the server keeps distinct letters only. */
function CharFilter({ label, value, disabled, onSave }: { label: string; value: string; disabled: boolean; onSave: (value: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="text-on-surface">{label}</span>
      <input
        // Remount when the server changes the value, so the field shows it.
        key={value}
        defaultValue={value}
        disabled={disabled}
        maxLength={MAX_CHAR_FILTER * 2}
        spellCheck={false}
        autoComplete="off"
        onBlur={(event) => event.currentTarget.value !== value && onSave(event.currentTarget.value)}
        onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
        className="w-28 bg-surface-container-lowest px-2 py-1 font-body text-body-md font-bold text-secondary disabled:opacity-60"
      />
    </label>
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
