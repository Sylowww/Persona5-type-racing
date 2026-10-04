"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { checkQuickMatch, joinQuickMatch, leaveQuickMatch } from "@/features/lobby/actions";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import type { QuickMatchStatus } from "@/lib/lobby-store";
import { QUICK_MATCH_BOT_DELAY_MS, VERSUS_SCREEN_MS } from "@/lib/matchmaking";
import { VersusScreen } from "./versus-screen";

/** How often the page checks in with matchmaking; well under the queue's stale delay. */
const POLL_MS = 1_000;

type QuickMatchSearchProps = {
  dictionary: Dictionary["quick"];
  characterNames: Dictionary["profile"]["character"]["names"];
  botNames: Dictionary["lobby"]["bots"]["difficulties"];
  locale: Locale;
};

/** Searches for a 1v1 while the page is open; leaving the page cancels the search. */
export function QuickMatchSearch({ dictionary, characterNames, botNames, locale }: QuickMatchSearchProps) {
  const router = useRouter();
  const [status, setStatus] = useState<QuickMatchStatus>({ state: "searching", waitedMs: 0 });
  const [isLeaving, startLeaving] = useTransition();
  const matched = useRef(false);

  useEffect(() => {
    let active = true;
    let timer: number | undefined;

    function handle(next: QuickMatchStatus) {
      if (!active) return;
      setStatus(next);
      if (next.state === "matched") {
        // The versus screen plays first; the server delays the race start to leave time for it.
        matched.current = true;
        router.prefetch(`/${locale}/lobby/${next.code}/race`);
        timer = window.setTimeout(() => router.replace(`/${locale}/lobby/${next.code}/race`), VERSUS_SCREEN_MS);
        return;
      }
      // Out of the queue while still searching (e.g. a late cancel from a previous render): join again.
      const poll = next.state === "idle" ? () => joinQuickMatch(locale) : checkQuickMatch;
      timer = window.setTimeout(() => void poll().then(handle), POLL_MS);
    }

    void joinQuickMatch(locale).then(handle);
    return () => {
      active = false;
      window.clearTimeout(timer);
      if (!matched.current) void leaveQuickMatch();
    };
  }, [locale, router]);

  const seconds = status.state === "searching" ? Math.floor(status.waitedMs / 1000) : 0;
  const botIn = Math.max(0, Math.ceil(QUICK_MATCH_BOT_DELAY_MS / 1000) - seconds);

  return (
    <>
      {status.state === "matched" && (
        <VersusScreen dictionary={dictionary.versus} characterNames={characterNames} botNames={botNames} racers={status.racers} />
      )}
      <section className="flex flex-col items-center gap-6 bg-surface-container p-7 text-center shadow-hard-xl shadow-primary-container">
        <Icon name="swords" size={56} className="text-primary-container motion-safe:animate-pulse" />
        <p role="status" className="font-display text-headline-md uppercase italic tracking-wider text-secondary">
          {status.state === "matched" ? dictionary.found : formatMessage(dictionary.waited, { seconds })}
        </p>
        {status.state !== "matched" && (
          <p className="font-hud text-label-hud font-black uppercase tracking-widest text-secondary-fixed">
            {formatMessage(dictionary.botIn, { seconds: botIn })}
          </p>
        )}
        <button
          type="button"
          disabled={isLeaving || status.state === "matched"}
          onClick={() =>
            startLeaving(async () => {
              await leaveQuickMatch();
              router.push(`/${locale}`);
            })
          }
          className="-skew-x-6 bg-surface-container-high px-6 py-2 font-hud text-headline-sm font-black uppercase italic text-error shadow-hard-sm hover:bg-error-container hover:text-on-error-container disabled:opacity-50"
        >
          {dictionary.cancel}
        </button>
      </section>
    </>
  );
}
