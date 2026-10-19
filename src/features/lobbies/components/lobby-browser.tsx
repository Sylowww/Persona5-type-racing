"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { joinListedLobby } from "@/features/lobby/actions";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { locales, type Locale } from "@/i18n/locales";
import { textComplexities } from "@/lib/race-settings";
import type { PublicLobby, RaceMode, TextComplexity } from "@/types/lobby";

/** The list reloads on its own this often. */
const REFRESH_MS = 5_000;

type LanguageFilter = Locale | "all";
const languageFilters: readonly LanguageFilter[] = ["all", ...locales];
type ComplexityFilter = TextComplexity | "all";
const complexityFilters: readonly ComplexityFilter[] = ["all", ...textComplexities];

type LobbyBrowserProps = {
  dictionary: Dictionary["lobbies"];
  modeNames: Pick<Dictionary["lobby"]["rules"]["mode"], RaceMode>;
  complexityNames: Record<TextComplexity, string>;
  locale: Locale;
  lobbies: readonly PublicLobby[];
};

function timeLimit(dictionary: Dictionary["lobbies"], seconds: number | null): string {
  if (seconds === null) return dictionary.noLimit;
  return seconds < 60 ? formatMessage(dictionary.seconds, { count: seconds }) : formatMessage(dictionary.minutes, { count: seconds / 60 });
}

/** Public lobbies, refreshed every few seconds; joining one opens it. */
export function LobbyBrowser({ dictionary, modeNames, complexityNames, locale, lobbies }: LobbyBrowserProps) {
  const router = useRouter();
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [language, setLanguage] = useState<LanguageFilter>("all");
  const [complexity, setComplexity] = useState<ComplexityFilter>("all");
  const shown = lobbies.filter(
    (lobby) => (language === "all" || lobby.settings.language === language) && (complexity === "all" || lobby.settings.complexity === complexity),
  );

  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [router]);

  function join(code: string) {
    startTransition(async () => {
      let result = await joinListedLobby(code, locale);
      // One lobby at a time (SALLE-06): ask before leaving the current one.
      if (result === "alreadyInLobby" && window.confirm(dictionary.errors.alreadyInLobby)) result = await joinListedLobby(code, locale, true);
      setError({ code, message: dictionary.errors[result] });
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-4 bg-surface-container p-4 shadow-hard-xl shadow-primary-container sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-4">
          <FilterGroup
            label={dictionary.filters.language}
            options={languageFilters.map((option) => ({ value: option, label: dictionary.filters.languages[option] }))}
            value={language}
            onPick={setLanguage}
          />
          <FilterGroup
            label={dictionary.filters.complexity}
            options={complexityFilters.map((option) => ({ value: option, label: option === "all" ? dictionary.filters.languages.all : complexityNames[option] }))}
            value={complexity}
            onPick={setComplexity}
          />
        </div>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="flex -skew-x-6 items-center gap-1 bg-surface-container-high px-3 py-1 font-hud text-label-hud font-black uppercase text-secondary shadow-hard-xs hover:-translate-y-0.5"
        >
          <Icon name="refresh" size={16} />
          {dictionary.refresh}
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-3 bg-surface-container-lowest px-4 py-10 text-center">
          <Icon name="theater_comedy" size={40} className="text-primary-container" />
          <p className="text-on-surface-variant">{lobbies.length === 0 ? dictionary.empty : dictionary.emptyFiltered}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((lobby) => {
            const isFull = lobby.playerCount >= lobby.capacity;
            const isRacing = lobby.phase === "countdown" || lobby.phase === "racing";
            const status = isRacing ? dictionary.racing : isFull ? dictionary.full : dictionary.waiting;
            return (
              <li key={lobby.code} className="flex flex-col gap-1 bg-surface-container-lowest px-3 py-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-hud text-[15px] font-black uppercase text-secondary">
                      {formatMessage(dictionary.host, { name: lobby.hostName })}
                    </span>
                    <span className="font-hud text-[12px] font-bold uppercase tracking-wider text-on-surface-variant">
                      {[
                        lobby.code,
                        lobby.settings.language.toUpperCase(),
                        complexityNames[lobby.settings.complexity],
                        modeNames[lobby.settings.mode],
                        timeLimit(dictionary, lobby.settings.timeLimitSec),
                      ].join(" // ")}
                    </span>
                  </div>
                  <span className="font-hud text-label-hud font-black uppercase text-secondary-fixed">
                    {formatMessage(dictionary.players, { count: lobby.playerCount, capacity: lobby.capacity })}
                  </span>
                  <span className={`font-hud text-label-hud font-black uppercase ${isRacing || isFull ? "text-primary" : "text-on-surface-variant"}`}>
                    {status}
                  </span>
                  <button
                    type="button"
                    disabled={isPending || isFull || isRacing}
                    onClick={() => join(lobby.code)}
                    aria-label={`${dictionary.join} - ${formatMessage(dictionary.host, { name: lobby.hostName })}`}
                    className="-skew-x-6 bg-primary-container px-4 py-1 font-hud text-label-hud font-black uppercase italic text-on-primary-container shadow-hard-sm shadow-secondary enabled:hover:-translate-y-0.5 disabled:bg-surface-container-high disabled:text-outline disabled:shadow-none"
                  >
                    {dictionary.join}
                  </button>
                </div>
                {error?.code === lobby.code && (
                  <p role="alert" className="text-[12px] text-error">
                    {error.message}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type FilterGroupProps<T extends string> = { label: string; options: readonly { value: T; label: string }[]; value: T; onPick: (value: T) => void };

function FilterGroup<T extends string>({ label, options, value, onPick }: FilterGroupProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1">
      <span className="mr-1 font-hud text-label-hud font-black uppercase tracking-widest text-on-surface-variant">{label}</span>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onPick(option.value)}
            className={`px-3 py-1 font-hud text-label-hud font-black uppercase ${
              isActive ? "bg-primary-container text-on-primary-container shadow-hard-xs" : "bg-surface-container-high text-on-surface-variant hover:text-secondary"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
