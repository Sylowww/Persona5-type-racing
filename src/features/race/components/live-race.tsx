"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import {
  accuracy,
  correctPrefixLength,
  deleteChar,
  initialTypingState,
  isFinished,
  placeOf,
  progress,
  typeChar,
  wordsPerMinute,
} from "@/lib/typing";
import type { Race } from "@/types/race";
import { RaceHud } from "./race-hud";
import { RaceStats } from "./race-stats";
import { RaceTrack } from "./race-track";
import { TypingText } from "./typing-text";

const TICK_MS = 100;

type LiveRaceProps = {
  dictionary: Dictionary["race"];
  locale: Locale;
  race: Race;
};

// Local-only for now: the race starts on the first key and rivals come from mock data.
export function LiveRace({ dictionary, locale, race }: LiveRaceProps) {
  const [typing, setTyping] = useState(initialTypingState);
  const [now, setNow] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const finished = isFinished(typing);
  const isRacing = typing.startedAt !== null && !finished;

  useEffect(() => {
    if (!isRacing) return;
    const timer = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(timer);
  }, [isRacing]);

  // Diffing the input value (instead of keydown) also supports IME and mobile keyboards.
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    const time = Date.now();
    setNow(time);
    setTyping((state) => {
      let next = state;
      while (next.typed.length > 0 && !value.startsWith(next.typed)) next = deleteChar(next);
      for (const char of value.slice(next.typed.length)) next = typeChar(next, race.text, char, time);
      return next;
    });
  }

  const endTime = typing.finishedAt ?? now;
  const elapsedMs = typing.startedAt === null ? 0 : Math.max(0, endTime - typing.startedAt);
  const wpm = wordsPerMinute(correctPrefixLength(race.text, typing.typed), elapsedMs);
  const racers = race.racers.map((racer) =>
    racer.id === race.youId ? { ...racer, progress: progress(race.text, typing.typed), wpm } : racer,
  );

  const status = finished ? dictionary.arena.finished : isRacing ? dictionary.arena.live : dictionary.arena.waiting;

  return (
    <div className="flex flex-col gap-4">
      <RaceHud
        dictionary={dictionary.hud}
        elapsedMs={elapsedMs}
        wordCount={race.text.split(" ").length}
        place={placeOf(racers, race.youId)}
        racerCount={racers.length}
      />

      <RaceTrack dictionary={dictionary.track} locale={locale} racers={racers} youId={race.youId} />

      <section
        aria-label={dictionary.arena.label}
        className="relative flex cursor-text flex-col gap-4 bg-surface-container-lowest p-4 shadow-hard-xl shadow-primary-container md:p-7"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="-skew-x-6 bg-primary-container px-2 py-0.5 font-hud text-[14px] font-black uppercase tracking-wider text-on-primary-container">
              {dictionary.arena.label}
            </h2>
            <span className="font-hud text-label-hud font-black uppercase text-on-surface-variant">
              {isFocused ? dictionary.arena.focused : dictionary.arena.hint}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-hud text-label-hud font-black uppercase text-on-surface-variant">
              {formatMessage(dictionary.arena.mistakes, { count: typing.mistakes })}
            </span>
            <span role="status" className="flex items-center gap-1.5 font-hud text-label-hud font-black uppercase text-secondary-fixed">
              <span aria-hidden="true" className={`size-2 rounded-full bg-secondary-fixed ${isRacing ? "motion-safe:animate-ping" : ""}`} />
              {status}
            </span>
          </div>
        </div>

        <div
          className={`relative min-h-[220px] bg-surface-container-low px-4 py-7 md:px-7 ${
            isFocused ? "outline-2 outline-secondary-fixed" : ""
          }`}
        >
          <TypingText text={race.text} typed={typing.typed} />
        </div>

        <input
          ref={inputRef}
          aria-label={dictionary.arena.inputLabel}
          className="sr-only"
          value={typing.typed}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          readOnly={finished}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </section>

      <RaceStats
        dictionary={dictionary.stats}
        locale={locale}
        wpm={wpm}
        streak={typing.streak}
        mistakes={typing.mistakes}
        accuracy={accuracy(typing.keystrokes, typing.mistakes)}
      />
    </div>
  );
}
