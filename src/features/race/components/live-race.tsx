"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition, type ChangeEvent, type CSSProperties, type MouseEvent } from "react";
import { forfeitLobbyRace, sendLobbyCallingCard } from "@/features/lobby/actions";
import { useGuestRaces } from "@/features/home/use-guest-races";
import { Icon } from "@/components/ui/icon";
import { useLobbyStream } from "@/features/lobby/use-lobby-stream";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import {
  accuracy,
  deleteChar,
  initialTypingState,
  isFinished,
  netChars,
  normalizeTypedChar,
  progress,
  typeChar,
  wordsPerMinute,
  type TypingState,
} from "@/lib/typing";
import { FINAL_COLLAPSE_MS, isChaos } from "@/lib/palace-collapse";
import { initialFeatTracker, trackFeats, type Feat } from "@/lib/race-feats";
import { exitGlow, ghostLead, ghostProgress } from "@/lib/race-moments";
import { summarizeRaces } from "@/lib/race-history";
import { playFeat } from "@/lib/sound-effects";
import type { LobbyView } from "@/types/lobby";
import type { InputEvent, RaceYou } from "@/types/race";
import { useInputSender } from "../use-input-sender";
import { useFinishFrame, useFirstFinisher, useHoldUp, useOvertakeFlash } from "../use-race-highlights";
import { spellStyle } from "../spell-style";
import { BonusFeed } from "./bonus-feed";
import { CallingCardFlash, PinnedCard } from "./calling-card-attack";
import { CountdownCutIn } from "./countdown-cut-in";
import { FEAT_POPUP_MS, ONE_MORE_MS, OneMoreBurst, type FeatPopupItem } from "./feat-popups";
import { FinishCutIn } from "./finish-cut-in";
import { HoldUpCutIn } from "./hold-up-cut-in";
import { MonaComms } from "./mona-comms";
import { PalaceCollapse } from "./palace-collapse";
import { RaceAnnouncement } from "./race-announcement";
import { RaceHud } from "./race-hud";
import { RaceStats } from "./race-stats";
import { RaceTrack } from "./race-track";
import { SpellCutIn } from "./spell-cut-in";
import { TypingText } from "./typing-text";
import { WinnerCutIn } from "./winner-cut-in";

const TICK_MS = 100;

// Glass shards thrown out when a countdown number lands: where each one flies (px), its spin and color.
const countdownShards = [
  { x: -150, y: -70, r: -200, color: "bg-secondary" },
  { x: 140, y: -90, r: 160, color: "bg-secondary-fixed" },
  { x: -170, y: 50, r: 240, color: "bg-primary-container" },
  { x: 160, y: 70, r: -180, color: "bg-secondary" },
  { x: -40, y: -120, r: 120, color: "bg-primary-container" },
  { x: 50, y: 120, r: -260, color: "bg-secondary-fixed" },
] as const;

/** Without a time limit, the palace still collapses at the pace of a 3-minute race. */
const UNTIMED_COLLAPSE_PACE_MS = 180_000;
/** How long the powers slot announces an Ambush or a calling card. */
const ANNOUNCE_MS = 3_000;
/** When several feats come from one change, the sound of the most notable one plays. */
const FEAT_SOUND_ORDER: readonly Feat[] = ["oneMore", "critical", "technical", "miss"];

/** A feat earned by one key: where it was typed, and the perfect words in a row at that moment. */
type EarnedFeat = { feat: Feat; index: number; words: number };

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
  /** The registered player's record WPM (null without one); guests use the races saved in this tab instead. */
  recordWpm: number | null;
  isGuest: boolean;
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
export function LiveRace({ dictionary, locale, initialView, recordWpm, isGuest }: LiveRaceProps) {
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
  const mode = race?.mode ?? "normal";
  const isSuddenDeath = mode === "suddenDeath";

  const [now, setNow] = useState(initialView.serverNow);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastKeyAt = useRef<number | null>(null);
  // Feats are presentation only: popups float above the characters that earned them.
  const featTracker = useRef(initialFeatTracker);
  const popupId = useRef(0);
  const [popups, setPopups] = useState<readonly FeatPopupItem[]>([]);
  const [oneMore, setOneMore] = useState<{ at: number; words: number } | null>(null);
  const [isSendingCard, startSendCard] = useTransition();
  // Third Eye: the ghost of the player's record runs in their lane.
  const [thirdEye, setThirdEye] = useState(false);
  const guestRaces = useGuestRaces();
  const record = isGuest ? summarizeRaces(guestRaces).bestWpm || null : recordWpm;

  // Spectators watch the track without a typing area (COURSE-05).
  const isSpectator = !view.race?.you;
  // Follow the lobby: results once the server ends the race (after the final collapse), the lobby if the race is gone.
  // Spectators have no results: they go back to the lobby after the collapse.
  const resultsHref =
    view.phase !== "finished" ? null : view.hasResult ? `/${locale}/lobby/${view.code}/results` : isSpectator ? `/${locale}/lobby/${view.code}` : null;
  useEffect(() => {
    if (status === "closed") router.replace(`/${locale}`);
    else if (resultsHref) return;
    else if (view.phase === "waiting" || !view.race) router.replace(`/${locale}/lobby/${view.code}`);
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
  const forfeitedAt = race?.you?.forfeitedAt ?? null;
  const [isForfeiting, startForfeit] = useTransition();
  const isCountdown = now < startsAt;
  // Keys typed before hydration would be dropped when React takes over the input, so it opens only after.
  const hydrated = useHydrated();
  // Spells cast on you: a hex blurs your next words, a stun locks your keys (the server ignores them meanwhile).
  const hex = race?.you?.hex && race.you.hex.until > now ? race.you.hex.element : null;
  const stun = race?.you?.stun && race.you.stun.until > now ? race.you.stun.element : null;
  const isOpen =
    hydrated &&
    !isSpectator &&
    race !== null &&
    !isCountdown &&
    !finished &&
    !eliminated &&
    forfeitedAt === null &&
    stun === null &&
    view.phase !== "finished";
  const canForfeit = !isSpectator && race !== null && !finished && !eliminated && forfeitedAt === null && view.phase !== "finished";

  // autoFocus can run before hydration, so place the caret here too.
  useEffect(() => {
    const input = inputRef.current;
    if (!input || !isOpen) return;
    input.focus();
    keepCaretAtEnd(input);
  }, [isOpen]);

  function showFeats(feats: readonly EarnedFeat[], at: number) {
    if (feats.length === 0) return;
    const added: FeatPopupItem[] = [];
    for (const { feat, index, words } of feats) {
      if (feat === "oneMore") setOneMore({ at, words });
      else added.push({ id: ++popupId.current, feat, index, at });
    }
    if (added.length > 0) setPopups((current) => [...current.filter((popup) => at - popup.at < FEAT_POPUP_MS), ...added]);
    const loudest = FEAT_SOUND_ORDER.find((feat) => feats.some((earned) => earned.feat === feat));
    if (loudest) playFeat(loudest);
  }

  // Diffing the input value (instead of keydown) also supports IME and mobile keyboards.
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (!isOpen) return;
    const value = event.target.value;
    const time = Date.now();
    const serverTime = time + offsetMs;
    setNow(serverTime);

    const events: InputEvent[] = [];
    const feats: EarnedFeat[] = [];
    let next = typing;
    while (next.typed.length > 0 && !value.startsWith(next.typed)) {
      next = deleteChar(next);
      events.push({ type: "delete" });
    }
    for (const char of value.slice(next.typed.length)) {
      if (isFinished(next) || (isSuddenDeath && next.mistakes > 0)) break;
      const after = typeChar(next, text, normalizeTypedChar(text[next.typed.length], char, caseSensitive), serverTime, mode);
      const averageWpm = wordsPerMinute(netChars(text, next.typed, mode), serverTime - startsAt);
      const earned = trackFeats(featTracker.current, next, after, text, serverTime, averageWpm);
      featTracker.current = earned.tracker;
      for (const feat of earned.feats) feats.push({ feat, index: next.typed.length, words: earned.tracker.perfectWords });
      next = after;
      events.push({ type: "char", char, delayMs: lastKeyAt.current === null ? 0 : time - lastKeyAt.current });
      lastKeyAt.current = time;
    }
    setTyping(next);
    sender.push(events);
    showFeats(feats, serverTime);
  }

  function sendCard(event: MouseEvent<HTMLButtonElement>) {
    // The arena focuses the input on click; the card goes out and typing goes on.
    event.stopPropagation();
    startSendCard(async () => void (await sendLobbyCallingCard(view.code)));
    inputRef.current?.focus();
  }

  const endTime = typing.finishedAt ?? race?.you?.eliminatedAt ?? forfeitedAt ?? now;
  const elapsedMs = race === null ? 0 : Math.max(0, endTime - startsAt);
  const wpm = wordsPerMinute(netChars(text, typing.typed, mode), elapsedMs);
  const racers = (race?.racers ?? []).map((racer) =>
    racer.id === view.youId
      ? { ...racer, progress: progress(text, typing.typed, mode), wpm, mistakes: typing.mistakes, isEliminated: eliminated, isForfeited: forfeitedAt !== null }
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
  const holdUp = useHoldUp(racers, view.youId, now);
  const card = race?.you?.card && race.you.card.until > now ? race.you.card : null;
  const ambush = race?.ambush && now - race.ambush.at < ANNOUNCE_MS ? race.ambush : null;
  const sentCard = race?.callingCards.findLast((sent) => now - sent.at < ANNOUNCE_MS) ?? null;
  const ownProgress = progress(text, typing.typed, mode);
  const ghost = thirdEye && record && race ? ghostProgress(record, Math.max(0, now - startsAt), text.length) : null;
  const lead = ghost === null ? null : ghostLead(ownProgress, ghost, text.length);
  const visiblePopups = popups.filter((popup) => now - popup.at < FEAT_POPUP_MS);
  const place = view.race?.you?.place ?? racers.length;
  const secondsLeft = Math.max(1, Math.ceil((startsAt - now) / 1000));

  const statusText =
    status === "reconnecting"
      ? dictionary.arena.reconnecting
      : eliminated
        ? dictionary.arena.eliminated
        : forfeitedAt !== null
          ? dictionary.arena.forfeited
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
      {race && !raceOver && <SpellCutIn dictionary={dictionary.spells} events={race.bonusEvents} youId={view.youId} />}
      {winner && !raceOver && <WinnerCutIn dictionary={dictionary.winner} name={winner.name} character={winner.character} />}
      {holdUp && !raceOver && !isSpectator && (
        <HoldUpCutIn key={holdUp.at} dictionary={dictionary.holdUp} name={holdUp.racer.name} character={holdUp.racer.character} />
      )}
      {race && !raceOver && <CallingCardFlash dictionary={dictionary.callingCards} cards={race.callingCards} youId={view.youId} now={now} />}
      {showFinishFrame && youRacer && (
        <FinishCutIn dictionary={dictionary.finish} character={youRacer.character} />
      )}
      <MonaComms
        dictionary={dictionary.comms}
        now={now}
        active={race !== null && !isCountdown && !raceOver && !isSpectator}
        place={place}
        streak={typing.streak}
        progress={ownProgress}
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
        <div className="flex flex-col gap-6">
          <RaceHud
            dictionary={dictionary.hud}
            elapsedMs={elapsedMs}
            // The race clock keeps running after you finish: the race ends at the limit or once everyone is done.
            remainingMs={race?.isTimed ? Math.max(0, race.endsAt - Math.max(now, startsAt)) : null}
            wordCount={text.split(" ").length}
            place={isSpectator ? null : place}
            racerCount={racers.length}
          />

          {/* A fixed-height slot, so announcements never push the track and the typing area around. */}
          {race?.bonusesOn && (
            <div className="relative h-[92px] overflow-hidden">
              <BonusFeed dictionary={dictionary.spells} events={race.bonusEvents} youId={view.youId} />
              {sentCard ? (
                <RaceAnnouncement
                  key={`card-${sentCard.id}`}
                  title={dictionary.callingCards.kicker}
                  line={formatMessage(sentCard.toId === view.youId ? dictionary.callingCards.onYou : dictionary.callingCards.announce, {
                    from: sentCard.from,
                    to: sentCard.to,
                  })}
                />
              ) : (
                ambush && (
                  <RaceAnnouncement
                    key="ambush"
                    title={dictionary.ambush.title}
                    line={ambush.racerId === view.youId ? dictionary.ambush.you : formatMessage(dictionary.ambush.other, { name: ambush.name })}
                  />
                )
              )}
            </div>
          )}

          <RaceTrack
            dictionary={dictionary.track}
            locale={locale}
            racers={racers}
            youId={view.youId}
            now={now}
            overtakerIds={overtakerIds}
            exitGlow={exitGlow(leaderProgress)}
            chaos={chaos && !raceOver}
            ghost={ghost === null || record === null ? null : { progress: ghost, wpm: record }}
          />

          {!isSpectator && (
            <section
              aria-label={dictionary.arena.label}
              className="panel relative flex cursor-text flex-col gap-4 border-t-4 border-t-primary-container p-4 md:p-6"
              onClick={() => inputRef.current?.focus()}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-4">
                  <h2 className="eyebrow text-secondary">
                    {dictionary.arena.label}
                  </h2>
                  <span className="font-hud text-label-hud font-black uppercase text-on-surface-variant">
                    {isFocused ? dictionary.arena.focused : dictionary.arena.hint}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {race?.you?.canSendCard && (
                    <button
                      type="button"
                      disabled={isSendingCard}
                      title={dictionary.callingCards.sendHint}
                      onClick={sendCard}
                      className="flex -skew-x-6 items-center gap-1.5 bg-primary-container px-3 py-0.5 font-hud text-label-hud font-black uppercase text-on-primary-container shadow-hard-sm transition-transform hover:-translate-y-0.5 disabled:opacity-60 motion-safe:animate-pulse"
                    >
                      <Icon name="style" size={18} filled />
                      {dictionary.callingCards.send}
                    </button>
                  )}
                  <button
                    type="button"
                    aria-pressed={thirdEye}
                    disabled={!record}
                    title={record ? (thirdEye ? dictionary.thirdEye.hide : dictionary.thirdEye.show) : dictionary.thirdEye.noRecord}
                    onClick={(event) => {
                      event.stopPropagation();
                      setThirdEye((current) => !current);
                      inputRef.current?.focus();
                    }}
                    className={`flex items-center gap-1.5 border px-2 py-0.5 font-hud text-label-hud font-black uppercase transition-colors disabled:opacity-40 ${
                      thirdEye ? "border-spell-ice bg-spell-ice/15 text-spell-ice" : "border-surface-container-highest text-on-surface-variant hover:text-spell-ice"
                    }`}
                  >
                    <Icon name={thirdEye ? "visibility" : "visibility_off"} size={18} />
                    {dictionary.thirdEye.label}
                  </button>
                  {lead !== null && (
                    <span className="font-hud text-label-hud font-black uppercase text-spell-ice">
                      {lead === 0
                        ? dictionary.thirdEye.even
                        : formatMessage(lead > 0 ? dictionary.thirdEye.ahead : dictionary.thirdEye.behind, { count: Math.abs(lead) })}
                    </span>
                  )}
                  {isSuddenDeath && (
                    <span className="font-hud text-label-hud font-black uppercase text-error">{dictionary.arena.suddenDeath}</span>
                  )}
                  {canForfeit && (
                    <button
                      type="button"
                      disabled={isForfeiting}
                      onClick={(event) => {
                        // The arena focuses the input on click; giving up should not.
                        event.stopPropagation();
                        if (window.confirm(dictionary.arena.forfeitConfirm)) startForfeit(async () => void (await forfeitLobbyRace(view.code)));
                      }}
                      className="border border-surface-container-highest px-2 py-0.5 font-hud text-label-hud font-black uppercase text-error transition-colors hover:bg-error-container hover:text-on-error-container disabled:opacity-60"
                    >
                      {dictionary.arena.forfeit}
                    </button>
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
                className={`relative min-h-[220px] bg-surface-container-lowest px-4 py-7 md:px-7 ${
                  isFocused ? "outline-2 outline-secondary-fixed" : ""
                }`}
              >
                {/* In blocking mode a wrong key is not typed: the character to fix is marked instead. */}
                <TypingText
                  text={text}
                  typed={typing.typed}
                  blocked={mode === "blocking" && typing.mistakes > 0 && typing.streak === 0}
                  hex={hex}
                  redacted={card !== null}
                  popups={visiblePopups}
                  featsDictionary={dictionary.feats}
                />
                {card && <PinnedCard dictionary={dictionary.callingCards} from={card.from} />}
                {oneMore && now - oneMore.at < ONE_MORE_MS && <OneMoreBurst key={oneMore.at} dictionary={dictionary.feats} words={oneMore.words} />}
                {hex === "bless" && <div aria-hidden="true" className="spell-flash-bless absolute inset-0" />}
                {stun && (
                  <div className={`absolute inset-0 flex items-center justify-center spell-stun-${stun}`}>
                    <span className={`spell-burst flex items-center gap-2 bg-surface-container-lowest px-4 py-1 font-display text-headline-md uppercase italic shadow-hard-md ${spellStyle[stun].text}`}>
                      <Icon name={spellStyle[stun].icon} size={32} filled />
                      {dictionary.spells.stunned}
                    </span>
                  </div>
                )}
                {isCountdown && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-container-lowest/85">
                    <span className="font-hud text-label-hud font-black uppercase tracking-widest text-secondary-fixed">
                      {dictionary.arena.countdown}
                    </span>
                    {/* Keyed by the number, so each one rushes in and lands with a burst of shards (`.countdown-*`). */}
                    <span key={secondsLeft} className="relative">
                      {countdownShards.map(({ x, y, r, color }) => (
                        <span
                          key={`${x}-${y}`}
                          aria-hidden="true"
                          className={`countdown-shard absolute top-1/2 left-1/2 size-6 [clip-path:polygon(50%_0,100%_100%,0_70%)] ${color}`}
                          style={{ "--shard-x": `${x}px`, "--shard-y": `${y}px`, "--shard-r": `${r}deg` } as CSSProperties}
                        />
                      ))}
                      <span
                        role="timer"
                        aria-label={formatMessage(dictionary.arena.countdownValue, { seconds: secondsLeft })}
                        className="countdown-strike relative block -skew-x-6 bg-primary-container px-7 font-display text-[96px] leading-none text-secondary shadow-hard-xl"
                      >
                        {secondsLeft}
                      </span>
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
                // Pasting or dropping text is not typing (COURSE-04); the server's speed limit backs this up.
                onPaste={(event) => event.preventDefault()}
                onDrop={(event) => event.preventDefault()}
                readOnly={!isOpen}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </section>
          )}

          {!isSpectator && (
            <RaceStats
              dictionary={dictionary.stats}
              locale={locale}
              wpm={wpm}
              streak={typing.streak}
              mistakes={typing.mistakes}
              accuracy={accuracy(typing.keystrokes, typing.mistakes)}
            />
          )}
        </div>
      </PalaceCollapse>
    </>
  );
}
