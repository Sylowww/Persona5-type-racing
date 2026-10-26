"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { RaceTrack } from "@/features/race/components/race-track";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { formatMessage } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { replayDuration, replayFrame } from "@/lib/race-replay";
import type { RaceResult, ReplayEvent } from "@/types/race";

const SPEEDS = [1, 2, 4] as const;
/** Events listed under the track, newest first. */
const LOG_SIZE = 5;

type RaceReplayProps = {
  dictionary: Dictionary["results"]["replay"];
  /** Track labels, spell names and announcements, shared with the live race. */
  race: Dictionary["race"];
  locale: Locale;
  result: RaceResult;
};

function clock(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** The race played again on its track: runners, spells on the lanes and a log of what happened, with play, seek and speed. */
export function RaceReplay({ dictionary, race, locale, result }: RaceReplayProps) {
  const duration = replayDuration(result);
  const [atMs, setAtMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const tick = (time: number) => {
      const elapsed = (time - last) * speed;
      last = time;
      setAtMs((previous) => Math.min(duration, previous + elapsed));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, duration]);

  // Stops at the end; playing again from there starts over.
  if (playing && atMs >= duration) setPlaying(false);

  function togglePlay() {
    if (!playing && atMs >= duration) setAtMs(0);
    setPlaying(!playing);
  }

  const nameOf = (id: string) => result.racers.find((racer) => racer.id === id)?.name ?? "";
  const describe = (event: ReplayEvent) =>
    event.type === "spell"
      ? formatMessage(race.spells.announce[event.spell], { caster: nameOf(event.casterId), target: nameOf(event.targetId), name: race.spells.names[event.spell] })
      : event.type === "card"
        ? formatMessage(race.callingCards.announce, { from: nameOf(event.fromId), to: nameOf(event.toId) })
        : formatMessage(race.ambush.other, { name: nameOf(event.racerId) });
  const log = (result.events ?? []).filter((event) => event.atMs <= atMs).slice(-LOG_SIZE).reverse();

  return (
    <section aria-labelledby="race-replay-title" className="panel flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="race-replay-title" className="eyebrow">
          {dictionary.title}
        </h2>
        <div className="flex items-center gap-2" role="group" aria-label={dictionary.speed}>
          {SPEEDS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={speed === value}
              onClick={() => setSpeed(value)}
              className={`border px-2 py-0.5 font-hud text-label-hud font-black ${
                speed === value ? "border-secondary-fixed bg-secondary-fixed text-on-secondary-fixed" : "border-surface-container-highest text-on-surface-variant hover:text-secondary"
              }`}
            >
              ×{value}
            </button>
          ))}
        </div>
      </div>

      <RaceTrack dictionary={race.track} locale={locale} racers={replayFrame(result, atMs)} youId={result.youId} now={atMs} />

      <div className="flex items-center gap-3">
        <button type="button" onClick={togglePlay} aria-label={playing ? dictionary.pause : dictionary.play} className="btn-primary size-10 p-0">
          <Icon name={playing ? "pause" : "play_arrow"} size={22} />
        </button>
        <button
          type="button"
          onClick={() => {
            setAtMs(0);
            setPlaying(true);
          }}
          aria-label={dictionary.restart}
          className="btn-ghost size-10 p-0"
        >
          <Icon name="refresh" size={20} />
        </button>
        <input
          type="range"
          min={0}
          max={duration}
          step={100}
          value={Math.round(atMs)}
          onChange={(event) => setAtMs(Number(event.target.value))}
          aria-label={dictionary.timeline}
          aria-valuetext={clock(atMs)}
          className="min-w-0 flex-1 accent-primary-container"
        />
        <span className="shrink-0 whitespace-nowrap text-right font-hud text-label-hud font-black tabular-nums text-on-surface-variant">
          {clock(atMs)} / {clock(duration)}
        </span>
      </div>

      <div>
        <h3 className="mb-2 font-hud text-label-hud font-black uppercase tracking-widest text-on-surface-variant">{dictionary.log}</h3>
        {log.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">{dictionary.empty}</p>
        ) : (
          <ol className="flex flex-col gap-1">
            {log.map((event, index) => (
              <li key={`${event.type}-${event.atMs}-${index}`} className={`flex gap-3 text-body-md ${index === 0 ? "text-secondary" : "text-on-surface-variant"}`}>
                <span className="w-10 shrink-0 font-hud font-black tabular-nums text-secondary-fixed">{clock(event.atMs)}</span>
                {describe(event)}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
