"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type ChangeEvent } from "react";
import { useLobbyStream } from "@/features/lobby/use-lobby-stream";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import {
  accuracy,
  correctPrefixLength,
  deleteChar,
  initialTypingState,
  isFinished,
  normalizeTypedChar,
  progress,
  typeChar,
  wordsPerMinute,
  type TypingState,
} from "@/lib/typing";
import { FINAL_COLLAPSE_MS, isChaos } from "@/lib/palace-collapse";
import { exitGlow } from "@/lib/race-moments";
import type { LobbyView } from "@/types/lobby";
import type { InputEvent, RaceYou } from "@/types/race";
import { useInputSender } from "../use-input-sender";
import { useFinishFrame, useFirstFinisher, useOvertakeFlash } from "../use-race-highlights";
import { CountdownCutIn } from "./countdown-cut-in";
import { FinishCutIn } from "./finish-cut-in";
import { MonaComms } from "./mona-comms";
import { PalaceCollapse } from "./palace-collapse";
import { RaceHud } from "./race-hud";
import { RaceStats } from "./race-stats";
import { RaceTrack } from "./race-track";
import { TypingText } from "./typing-text";
import { WinnerCutIn } from "./winner-cut-in";

const TICK_MS = 100;
/** Without a time limit, the palace still collapses at the pace of a 3-minute race. */
const UNTIMED_COLLAPSE_PACE_MS = 180_000;

const noSubscription = () => () => {};

/** False in the server render and during hydration, true once React runs in the browser. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}

/** Typing always continues at the end, even after a reload restored earlier progress. */
function keepCaretAtEnd(input: HTMLInputElement) {
  const end = input.value.length;
  if (input.selectionStart !== end || input.selectionEnd !== end) input.setSelectionRange(end, end);
}

type LiveRaceProps = {
  dictionary: Dictionary["race"];
  locale: Locale;
  /** Snapshot rendered by the server; live updates arrive through the lobby stream. */
  initialView: LobbyView;
};

/** Restores local typing from the server, e.g. after a reload during the race. */
function typingFrom(you: RaceYou | null | undefined, startsAt: number): TypingState {
  if (!you) return initialTypingState;
  return {
    typed: you.typed,
    keystrokes: you.keystrokes,
    mistakes: you.mistakes,
    streak: you.streak,
    startedAt: you.keystrokes > 0 ? startsAt : null,
    finishedAt: you.finishedAt,
  };
}

// Typing is shown instantly from local state; the server replays the same keystrokes and owns progress, finish and places.
export function LiveRace({ dictionary, locale, initialView }: LiveRaceProps) {
  const router = useRouter();
  const [typing, setTyping] = useState(() => typingFrom(initialView.race?.you, initialView.race?.startsAt ?? 0));
  const sender = useInputSender(initialView.code);

  // The server's copy wins when this page has nothing in flight and either had all its batches applied
  // or has not typed yet (e.g. a batch sent just before a reload landed after it).
  const { view, status, offsetMs } = useLobbyStream(initialView, (next) => {
    const you = next.race?.you;
    if (!you || !next.race || !sender.isIdle()) return;
    const isOwn = you.inputClient === sender.clientId;
    if (isOwn ? you.inputSeq !== sender.sentSeq() : sender.sentSeq() !== 0) return;
    const { startsAt: raceStart } = next.race;
    setTyping((current) =>
      current.typed === you.typed && current.keystrokes === you.keystrokes ? current : typingFrom(you, raceStart),
    );
  });
  const race = view.race ?? initialView.race;
  const text = race?.text ?? "";
  const startsAt = race?.startsAt ?? 0;
  const caseSensitive = race?.caseSensitive ?? true;
  const isSuddenDeath = race?.mode === "suddenDeath";

  const [now, setNow] = useState(initialView.serverNow);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastKeyAt = useRef<number | null>(null);

  // Follow the lobby: results once the server ends the race (after the final collapse), the lobby if the race is gone.
  const resultsHref = view.phase === "finished" && view.hasResult ? `/${locale}/lobby/${view.code}/results` : null;
  useEffect(() => {
    if (status === "closed") router.replace(`/${locale}`);
    else if (resultsHref) return;
    else if (view.phase === "waiting" || !view.race?.you) router.replace(`/${locale}/lobby/${view.code}`);
  }, [status, view, locale, router, resultsHref]);

  useEffect(() => {
    if (!resultsHref || status === "closed") return;
    const timer = window.setTimeout(() => router.replace(resultsHref), FINAL_COLLAPSE_MS);
    return () => window.clearTimeout(timer);
  }, [resultsHref, status, router]);

  // Server-aligned clock for the countdown and race timer.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now() + offsetMs), TICK_MS);
    return () => window.clearInterval(timer);
  }, [offsetMs]);

  const finished = isFinished(typing);
  // In sudden death the first mistake ends the race; shown at once, the server confirms it.
  const eliminated = (isSuddenDeath && typing.mistakes > 0) || (race?.you?.eliminatedAt ?? null) !== null;
  const isCountdown = now < startsAt;
  // Keys typed before hydration would be dropped when React takes over the input, so it opens only after.
  const hydrated = useHydrated();
  const isOpen = hydrated && race !== null && !isCountdown && !finished && !eliminated && view.phase !== "finished";

  // autoFocus can run before hydration, so place the caret here too.
  useEffect(() => {
    const input = inputRef.current;
    if (!input || !isOpen) return;
    input.focus();
    keepCaretAtEnd(input);
  }, [isOpen]);

  // Diffing the input value (instead of keydown) also supports IME and mobile keyboards.
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (!isOpen) return;
    const value = event.target.value;
    const time = Date.now();
    const serverTime = time + offsetMs;
    setNow(serverTime);

    const events: InputEvent[] = [];
    let next = typing;
    while (next.typed.length > 0 && !value.startsWith(next.typed)) {
      next = deleteChar(next);
      events.push({ type: "delete" });
    }
    for (const char of value.slice(next.typed.length)) {
      if (isFinished(next) || (isSuddenDeath && next.mistakes > 0)) break;
      next = typeChar(next, text, normalizeTypedChar(text[next.typed.length], char, caseSensitive), serverTime);
      events.push({ type: "char", char, delayMs: lastKeyAt.current === null ? 0 : time - lastKeyAt.current });
      lastKeyAt.current = time;
    }
    setTyping(next);
    sender.push(events);
  }

  const endTime = typing.finishedAt ?? race?.you?.eliminatedAt ?? now;
  const elapsedMs = race === null ? 0 : Math.max(0, endTime - startsAt);
  const wpm = wordsPerMinute(correctPrefixLength(text, typing.typed), elapsedMs);
  const racers = (race?.racers ?? []).map((racer) =>
    racer.id === view.youId
      ? { ...racer, progress: progress(text, typing.typed), wpm, mistakes: typing.mistakes, isEliminated: eliminated }
      : racer,
  );
  const leaderProgress = Math.max(0, ...racers.map((racer) => racer.progress));
  const chaos = isChaos(leaderProgress);
  const youRacer = racers.find((racer) => racer.id === view.youId);
  const raceOver = resultsHref !== null;
  // Presentation only: the server still decides places, finish and results.
  const overtakerIds = useOvertakeFlash(racers, view.youId, now);
  // Also shown when the last finisher ends the race: the collapse wedges (above it) then close over it.
  const showFinishFrame = useFinishFrame(finished, now);
  const winner = useFirstFinisher(racers, view.youId);
  const place = view.race?.you?.place ?? racers.length;
  const secondsLeft = Math.max(1, Math.ceil((startsAt - now) / 1000));

  const statusText =
    status === "reconnecting"
      ? dictionary.arena.reconnecting
      : eliminated
        ? dictionary.arena.eliminated
        : finished
          ? dictionary.arena.waitingOthers
          : isCountdown
            ? dictionary.arena.countdown
            : isOpen
              ? dictionary.arena.live
              : dictionary.arena.waiting;

  return (
    <>
      {/* Outside PalaceCollapse: its shaking wrapper would anchor this fixed overlay. */}
      {isCountdown && (
        <CountdownCutIn dictionary={dictionary.cutIn} callingCard={dictionary.callingCard} now={now} startsAt={startsAt} />
      )}
      {winner && !raceOver && <WinnerCutIn dictionary={dictionary.winner} name={winner.name} character={winner.character} />}
      {showFinishFrame && youRacer && (
        <FinishCutIn dictionary={dictionary.finish} character={youRacer.character} />
      )}
      <MonaComms
        dictionary={dictionary.comms}
        now={now}
        active={race !== null && !isCountdown && !raceOver}
        place={place}
        streak={typing.streak}
        progress={progress(text, typing.typed)}
        mistakes={typing.mistakes}
        finished={finished}
        chaos={chaos}
      />
      <PalaceCollapse
        now={now}
        startsAt={startsAt}
        endsAt={race?.isTimed === false ? startsAt + UNTIMED_COLLAPSE_PACE_MS : (race?.endsAt ?? startsAt)}
        leaderProgress={leaderProgress}
        collapsing={raceOver}
      >
        <div className="flex flex-col gap-4">
          <RaceHud
            dictionary={dictionary.hud}
            elapsedMs={elapsedMs}
            // The race clock keeps running after you finish: the race ends at the limit or once everyone is done.
            remainingMs={race?.isTimed ? Math.max(0, race.endsAt - Math.max(now, startsAt)) : null}
            wordCount={text.split(" ").length}
            place={place}
            racerCount={racers.length}
          />

          <RaceTrack
            dictionary={dictionary.track}
            locale={locale}
            racers={racers}
            youId={view.youId}
            now={now}
            overtakerIds={overtakerIds}
            exitGlow={exitGlow(leaderProgress)}
            chaos={chaos && !raceOver}
          />

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
                {isSuddenDeath && (
                  <span className="font-hud text-label-hud font-black uppercase text-error">{dictionary.arena.suddenDeath}</span>
                )}
                <span className="font-hud text-label-hud font-black uppercase text-on-surface-variant">
                  {formatMessage(dictionary.arena.mistakes, { count: typing.mistakes })}
                </span>
                <span role="status" className="flex items-center gap-1.5 font-hud text-label-hud font-black uppercase text-secondary-fixed">
                  <span aria-hidden="true" className={`size-2 rounded-full bg-secondary-fixed ${isOpen ? "motion-safe:animate-ping" : ""}`} />
                  {statusText}
                </span>
              </div>
            </div>

            <div
              className={`relative min-h-[220px] bg-surface-container-low px-4 py-7 md:px-7 ${
                isFocused ? "outline-2 outline-secondary-fixed" : ""
              }`}
            >
              <TypingText text={text} typed={typing.typed} />
              {isCountdown && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-container-lowest/85">
                  <span className="font-hud text-label-hud font-black uppercase tracking-widest text-secondary-fixed">
                    {dictionary.arena.countdown}
                  </span>
                  <span
                    role="timer"
                    aria-label={formatMessage(dictionary.arena.countdownValue, { seconds: secondsLeft })}
                    className="-skew-x-6 bg-primary-container px-7 font-display text-[96px] leading-none text-secondary shadow-hard-xl"
                  >
                    {secondsLeft}
                  </span>
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              aria-label={dictionary.arena.inputLabel}
              className="sr-only"
              value={typing.typed}
              onChange={handleChange}
              onFocus={(event) => {
                setIsFocused(true);
                keepCaretAtEnd(event.currentTarget);
              }}
              onSelect={(event) => keepCaretAtEnd(event.currentTarget)}
              onBlur={() => setIsFocused(false)}
              readOnly={!isOpen}
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
      </PalaceCollapse>
    </>
  );
}
