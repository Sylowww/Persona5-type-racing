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
      className={`group relative w-full cursor-pointer text-left transition-transform ${feedback === "pressed" ? "scale-[0.98]" : ""}`}
    >
      <span
        className={`relative flex flex-col justify-between gap-5 px-6 py-6 text-on-primary-container shadow-hard-xl transition-[transform,box-shadow] group-hover:-translate-y-1 group-hover:shadow-[8px_8px_0_var(--color-surface-container-lowest)] sm:flex-row sm:items-center md:px-8 ${
          feedback === "flash" ? "bg-secondary-container text-on-secondary-fixed" : "bg-primary-container"
        }`}
      >
        <span className="flex items-center gap-5">
          <Icon name="bolt" filled size={44} className="shrink-0" />
          <span className="flex flex-col gap-1">
            <span className="font-display text-headline-md uppercase italic leading-none tracking-wider md:text-headline-lg">
              {dictionary.title}
            </span>
            <span className="font-hud text-label-hud font-bold uppercase tracking-widest">{dictionary.hint}</span>
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2 font-hud text-label-hud font-black uppercase tracking-wider">
          <kbd className="border-2 border-current px-2 py-1">{dictionary.keys}</kbd>
          <span className="font-bold">{dictionary.or}</span>
          <kbd className="border-2 border-current px-2 py-1">{dictionary.altKeys}</kbd>
        </span>
      </span>
    </button>
  );
}
