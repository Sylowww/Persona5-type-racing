import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { LobbySettings, RaceMode } from "@/types/lobby";
import { KeySoundPicker } from "./key-sound-picker";

type RulesDossierProps = {
  dictionary: Dictionary["lobby"]["rules"];
  settings: LobbySettings;
  spectators: readonly string[];
};

const modes: readonly RaceMode[] = ["sprint", "burst", "hardcore"];

export function RulesDossier({ dictionary, settings, spectators }: RulesDossierProps) {
  const { mode, text } = dictionary;
  const textRules = [
    { label: text.punctuation, enabled: settings.punctuation },
    { label: text.numbers, enabled: settings.numbers },
    { label: text.casing, enabled: settings.caseSensitive },
  ];

  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex rotate-1 items-center justify-between bg-secondary-fixed px-4 py-2 text-on-secondary-fixed shadow-hard-md">
        <span className="font-hud text-headline-sm font-black uppercase italic tracking-wider">{dictionary.title}</span>
        <Icon name="assignment" size={20} />
      </h2>

      <div className="flex flex-col gap-4 bg-surface-container p-4 shadow-hard-xl">
        <div className="flex flex-col gap-1">
          <DirectiveTitle title={mode.title} tag={mode.tag} />
          <ul className="grid grid-cols-3 gap-2">
            {modes.map((option) => {
              const isActive = option === settings.mode;
              return (
                <li
                  key={option}
                  aria-current={isActive ? "true" : undefined}
                  className={`p-2 text-center ${isActive ? "bg-primary-container shadow-hard-xs" : "bg-surface-container-low opacity-70"}`}
                >
                  <span className={`block font-hud text-[10px] font-black uppercase ${isActive ? "text-secondary-fixed" : "text-outline"}`}>
                    {mode[option]}
                  </span>
                  <span className={`font-hud text-[15px] font-black ${option === "hardcore" ? "text-error" : "text-secondary"}`}>
                    {mode[`${option}Value`]}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-1 text-[12px] italic text-on-surface-variant">{mode.note}</p>
        </div>

        <hr className="border-surface-container-highest" />

        <div className="flex flex-col gap-1">
          <DirectiveTitle title={text.title} tag={settings.language} />
          <dl className="flex flex-col gap-1.5 bg-surface-container-low p-2">
            {textRules.map((rule) => (
              <div key={rule.label} className="flex items-center justify-between">
                <dt className="text-on-surface">{rule.label}</dt>
                <dd className={`font-hud text-[13px] font-black uppercase ${rule.enabled ? "text-secondary-fixed" : "text-outline"}`}>
                  {rule.enabled ? text.on : text.off}
                </dd>
              </div>
            ))}
          </dl>
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

function DirectiveTitle({ title, tag }: { title: string; tag: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="font-hud text-[11px] font-black uppercase tracking-widest text-primary">{title}</h3>
      <span className="font-hud text-[11px] font-black uppercase text-secondary-fixed">{tag}</span>
    </div>
  );
}
