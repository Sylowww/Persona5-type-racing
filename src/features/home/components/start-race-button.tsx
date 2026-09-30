"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/ui/icon";
import { createLobby } from "@/features/lobby/actions";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";

type Feedback = "idle" | "pressed" | "flash";

const PRESS_MS = 120;
const FLASH_MS = 250;

/** Elements that already handle Enter/Space themselves, so the global shortcut must not fire. */
function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.closest("input, textarea, select, button, a") !== null)
  );
}

type StartRaceButtonProps = {
  dictionary: Dictionary["home"]["startRace"];
  locale: Locale;
};

export function StartRaceButton({ dictionary, locale }: StartRaceButtonProps) {
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const timers = useRef<number[]>([]);
  const [isPending, startTransition] = useTransition();

  // Matchmaking does not exist yet: starting a race opens a new lobby to invite players into.
  const trigger = useCallback(() => {
    if (isPending) return;
    startTransition(() => createLobby(locale));
    timers.current.forEach(window.clearTimeout);
    setFeedback("pressed");
    timers.current = [
      window.setTimeout(() => setFeedback("flash"), PRESS_MS),
      window.setTimeout(() => setFeedback("idle"), PRESS_MS + FLASH_MS),
    ];
  }, [isPending, locale]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== "Enter" && event.code !== "Space") return;
      if (event.repeat || isInteractiveTarget(event.target)) return;
      event.preventDefault();
      trigger();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [trigger]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  return (
    <button
      type="button"
      onClick={trigger}
      aria-keyshortcuts="Enter Space"
      className={`group relative -mt-1 w-full cursor-pointer text-left transition-transform ${feedback === "pressed" ? "scale-95" : ""}`}
    >
      <span className="absolute -inset-1 translate-x-3 translate-y-3 rotate-[-1.8deg] bg-surface-container-lowest transition-transform group-hover:translate-x-4 group-hover:translate-y-4" />
      <span
        className={`relative block rotate-[-1.5deg] overflow-hidden p-7 text-on-primary-container shadow-hard-lg shadow-secondary-fixed transition-transform group-hover:-translate-y-1 ${
          feedback === "flash" ? "bg-secondary-container" : "bg-primary-container"
        }`}
      >
        <span className="pointer-events-none absolute top-0 right-0 flex h-full w-32 skew-x-[-18deg] flex-col justify-around bg-tertiary-container/30 opacity-40">
          <span className="h-2 bg-secondary" />
          <span className="h-2 bg-secondary" />
          <span className="h-2 bg-secondary" />
        </span>

        <span className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <span className="flex items-center gap-4">
            <span className="flex size-16 shrink-0 rotate-[-5deg] items-center justify-center bg-surface-container-lowest text-secondary-fixed shadow-hard-md shadow-secondary transition-transform group-hover:rotate-0">
              <Icon name="bolt" filled size={38} />
            </span>
            <span className="flex flex-col">
              <span className="flex flex-wrap items-center gap-1">
                <span className="bg-secondary-fixed px-2 py-0.5 font-hud text-label-hud font-black uppercase tracking-wider text-on-secondary-fixed">
                  {dictionary.queue}
                </span>
                <span className="font-hud text-label-hud font-black uppercase tracking-widest text-on-primary-fixed">
                  {dictionary.mode}
                </span>
              </span>
              <span className="mt-1 font-display text-headline-md md:text-headline-lg uppercase italic leading-none tracking-wider text-secondary drop-shadow-[2px_2px_0_var(--color-surface-container-lowest)]">
                {dictionary.title}
              </span>
            </span>
          </span>

          <span className="flex flex-col items-start gap-1 md:items-end">
            <span className="flex rotate-2 items-center gap-1 bg-surface-container-lowest px-4 py-1 shadow-hard-sm shadow-secondary">
              <kbd className="font-hud text-headline-sm font-black uppercase text-secondary-fixed">{dictionary.keys}</kbd>
              <span className="font-hud text-label-hud font-bold uppercase text-on-surface-variant">{dictionary.or}</span>
              <kbd className="font-hud text-headline-sm font-black uppercase text-secondary-fixed">{dictionary.altKeys}</kbd>
            </span>
            <span className="font-hud text-[11px] font-black uppercase tracking-widest text-on-primary-fixed">
              {dictionary.hint}
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}
