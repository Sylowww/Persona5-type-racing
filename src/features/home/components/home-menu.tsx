"use client";

import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { createLobby } from "@/features/lobby/actions";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";

type ItemId = "start" | "quick" | "training" | "browse";

const PRESS_MS = 120;
const FLASH_MS = 250;

/** Elements that already handle Enter/Space themselves, so the global shortcut must not fire. */
function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.closest("input, textarea, select, button, a") !== null)
  );
}

// Each entry sits at its own angle and indent, like the Persona 5 title menu.
const layout: Record<ItemId, string> = {
  start: "-rotate-3",
  quick: "rotate-1 ml-6 md:ml-16",
  training: "-rotate-2 ml-2 md:ml-6",
  browse: "rotate-2 ml-10 md:ml-24",
};

// The selection shard: a jagged red slash that snaps open behind the entry under the pointer or focus, while the entry
// swings toward the screen.
const itemClass =
  "group relative isolate flex w-fit cursor-pointer flex-wrap items-baseline gap-x-4 gap-y-1 text-left font-display uppercase italic leading-none text-secondary transition-transform duration-150 " +
  "before:absolute before:-inset-x-5 before:-inset-y-2 before:-z-10 before:origin-left before:scale-x-0 before:bg-primary-container before:transition-transform before:duration-150 " +
  "before:[clip-path:polygon(0_18%,6%_0,58%_10%,100%_0,95%_52%,100%_100%,40%_88%,3%_100%)] " +
  "after:absolute after:-inset-x-3 after:-inset-y-0.5 after:-z-20 after:origin-left after:scale-x-0 after:bg-secondary after:transition-transform after:delay-75 after:duration-150 " +
  "after:[clip-path:polygon(0_30%,10%_8%,70%_20%,100%_6%,92%_60%,98%_96%,30%_80%,0_92%)] " +
  "data-[active=true]:translate-x-2 motion-safe:data-[active=true]:[transform:perspective(700px)_rotateY(-14deg)] data-[active=true]:before:scale-x-100 data-[active=true]:after:scale-x-100 motion-reduce:transition-none motion-reduce:before:transition-none motion-reduce:after:transition-none";

const badgeClass = "not-italic font-hud text-label-hud font-black tracking-widest text-on-surface-variant group-data-[active=true]:text-on-primary-container";

type HomeMenuProps = {
  dictionary: Dictionary["home"];
  locale: Locale;
  /** Starts a solo training race (Server Function bound to the locale). */
  training: () => Promise<void>;
};

/** The home actions as a Persona 5–style title menu, with the selected entry's briefing underneath. */
export function HomeMenu({ dictionary, locale, training }: HomeMenuProps) {
  const { startRace, modes, menu } = dictionary;
  const [active, setActive] = useState<ItemId>("start");
  const [flash, setFlash] = useState(false);
  const [isPending, startTransition] = useTransition();
  const timers = useRef<number[]>([]);
  const ids = useId();

  // Starting a race opens a new lobby to invite players into.
  const start = useCallback(() => {
    if (isPending) return;
    startTransition(() => createLobby(locale));
    timers.current.forEach(window.clearTimeout);
    timers.current = [window.setTimeout(() => setFlash(true), PRESS_MS), window.setTimeout(() => setFlash(false), PRESS_MS + FLASH_MS)];
  }, [isPending, locale]);

  // Enter or Space anywhere on the page (outside a control) starts a race.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== "Enter" && event.code !== "Space") return;
      if (event.repeat || isInteractiveTarget(event.target)) return;
      event.preventDefault();
      start();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [start]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const briefs: Record<ItemId, string> = {
    start: startRace.hint,
    quick: modes.blitz.description,
    training: modes.training.description,
    browse: modes.browse.description,
  };

  // Hover and focus both move the selection, so the briefing follows the mouse and the keyboard.
  const select = (id: ItemId) => ({
    "data-active": active === id,
    "aria-describedby": `${ids}-${id}`,
    onMouseEnter: () => setActive(id),
    onFocus: () => setActive(id),
  });

  return (
    <nav aria-label={menu.label} className="flex flex-col gap-8">
      <ul className="flex flex-col gap-7 md:gap-9">
        <li className={layout.start}>
          <button
            type="button"
            onClick={start}
            aria-keyshortcuts="Enter Space"
            className={`${itemClass} text-[clamp(52px,7.5vw,120px)] ${flash ? "text-secondary-fixed" : ""}`}
            {...select("start")}
          >
            {startRace.title}
            <span className={`${badgeClass} flex items-center gap-2`}>
              <kbd className="border-2 border-current px-1.5 py-0.5">{startRace.keys}</kbd>
              {startRace.or}
              <kbd className="border-2 border-current px-1.5 py-0.5">{startRace.altKeys}</kbd>
            </span>
          </button>
        </li>
        <li className={layout.quick}>
          <Link href={`/${locale}/quick`} className={`${itemClass} text-[clamp(38px,5vw,80px)]`} {...select("quick")}>
            {modes.blitz.title}
            <span className={badgeClass}>{modes.blitz.badge}</span>
          </Link>
        </li>
        <li className={layout.training}>
          <form action={training}>
            <button type="submit" className={`${itemClass} text-[clamp(38px,5vw,80px)]`} {...select("training")}>
              {modes.training.title}
              <span className={badgeClass}>{modes.training.badge}</span>
            </button>
          </form>
        </li>
        <li className={layout.browse}>
          <Link href={`/${locale}/lobbies`} className={`${itemClass} text-[clamp(38px,5vw,80px)]`} {...select("browse")}>
            {modes.browse.title}
            <span className={badgeClass}>{modes.browse.badge}</span>
          </Link>
        </li>
      </ul>

      {(Object.keys(briefs) as ItemId[]).map((id) => (
        <span key={id} id={`${ids}-${id}`} className="sr-only">
          {briefs[id]}
        </span>
      ))}

      <Briefing label={menu.brief}>{briefs[active]}</Briefing>
    </nav>
  );
}

/** The dialogue box at the bottom of the menu, describing the selected entry (screen readers get it per entry instead). */
function Briefing({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div aria-hidden="true" className="relative max-w-xl -rotate-1">
      <span className="absolute -top-3 left-4 z-10 -skew-x-12 bg-primary-container px-3 py-0.5 font-hud text-label-hud font-black uppercase tracking-widest text-on-primary-container">
        {label}
      </span>
      <p className="min-h-[4.5rem] border-2 border-secondary bg-surface-container-lowest px-5 pt-5 pb-3 text-body-md text-secondary shadow-[6px_6px_0_var(--color-primary-container)] [clip-path:polygon(0_0,100%_0,100%_78%,96%_100%,0_100%)]">
        {children}
      </p>
    </div>
  );
}
