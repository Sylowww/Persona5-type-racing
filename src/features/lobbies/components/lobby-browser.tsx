"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { joinListedLobby } from "@/features/lobby/actions";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { locales, type Locale } from "@/i18n/locales";
import type { PublicLobby } from "@/types/lobby";

/** The list reloads on its own this often. */
const REFRESH_MS = 5_000;

type LanguageFilter = Locale | "all";
const languageFilters: readonly LanguageFilter[] = ["all", ...locales];

type LobbyBrowserProps = {
  dictionary: Dictionary["lobbies"];
  modeNames: Pick<Dictionary["lobby"]["rules"]["mode"], "normal" | "suddenDeath">;
  locale: Locale;
  lobbies: readonly PublicLobby[];
};

function timeLimit(dictionary: Dictionary["lobbies"], seconds: number | null): string {
  if (seconds === null) return dictionary.noLimit;
  return seconds < 60 ? formatMessage(dictionary.seconds, { count: seconds }) : formatMessage(dictionary.minutes, { count: seconds / 60 });
}

/** Public lobbies, refreshed every few seconds; joining one opens it. */
export function LobbyBrowser({ dictionary, modeNames, locale, lobbies }: LobbyBrowserProps) {
  const router = useRouter();
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [language, setLanguage] = useState<LanguageFilter>("all");
  const shown = language === "all" ? lobbies : lobbies.filter((lobby) => lobby.settings.language === language);

  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [router]);

  function join(code: string) {
    startTransition(async () => {
      const result = await joinListedLobby(code, locale);
      setError({ code, message: dictionary.errors[result] });
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-4 bg-surface-container p-4 shadow-hard-xl shadow-primary-container sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label={dictionary.filters.language} className="flex flex-wrap items-center gap-1">
          <span className="mr-1 font-hud text-label-hud font-black uppercase tracking-widest text-on-surface-variant">{dictionary.filters.language}</span>
          {languageFilters.map((option) => {
            const isActive = option === language;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={isActive}
                onClick={() => setLanguage(option)}
                className={`px-3 py-1 font-hud text-label-hud font-black uppercase ${
                  isActive ? "bg-primary-container text-on-primary-container shadow-hard-xs" : "bg-surface-container-high text-on-surface-variant hover:text-secondary"
                }`}
              >
                {dictionary.filters.languages[option]}
              </button>
            );
          })}
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
                      {[lobby.code, lobby.settings.language.toUpperCase(), modeNames[lobby.settings.mode], timeLimit(dictionary, lobby.settings.timeLimitSec)].join(" // ")}
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
