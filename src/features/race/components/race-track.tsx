import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/icon";
import { formatMessage } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/locales";
import { characterSprite } from "@/lib/characters";
import { RUNNER_OBSTACLES } from "@/lib/race-runner";
import type { RaceRacer } from "@/types/race";
import { RaceRunner, RUNNER_SIZE } from "./race-runner";

type RaceTrackProps = {
  dictionary: Dictionary["race"]["track"];
  locale: Locale;
  racers: readonly RaceRacer[];
  youId: string;
  /** Race clock, used only to animate the runners. */
  now: number;
  /** Racers who just passed the local player; their lane flashes. */
  overtakerIds?: ReadonlySet<string>;
  /** How strongly the exit glows at the end of every lane, from 0 to 1. */
  exitGlow?: number;
  /** Total chaos: stones fall onto the lanes. */
  chaos?: boolean;
};

/** Stones falling on a lane during the chaos: position and timing, fixed per lane so they do not jump around. */
function laneStones(lane: number) {
  return [0, 1, 2].map((stone) => {
    const seed = Math.sin((lane + 1) * 12.9898 + stone * 78.233) * 43758.5453;
    const random = seed - Math.floor(seed);
    return {
      left: `${12 + ((random * 997) % 1) * 70}%`,
      size: 5 + Math.round(random * 6),
      duration: `${2.2 + random * 1.4}s`,
      delay: `${(stone * 1.1 + random * 0.9).toFixed(2)}s`,
    };
  });
}

const quarterMarks = [0, 0.25, 0.5, 0.75] as const;


export function RaceTrack({
  dictionary,
  locale,
  racers,
  youId,
  now,
  overtakerIds,
  exitGlow = 0,
  chaos = false,
}: RaceTrackProps) {
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });

  return (
    <section aria-label={dictionary.label} className="relative w-full overflow-hidden bg-surface-container-low p-2 shadow-hard-xl">
      <div className="mb-1 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="font-hud text-label-hud font-black uppercase tracking-widest text-primary">{dictionary.label}</h2>
          <span className="font-hud text-[10px] uppercase text-on-surface-variant">
            {"// "}
            {formatMessage(dictionary.racers, { count: racers.length })}
          </span>
        </div>
        <div aria-hidden="true" className="hidden items-center gap-4 font-hud text-label-hud text-on-surface-variant sm:flex">
          {quarterMarks.map((mark) => (
            <span key={mark}>{percent.format(mark)}</span>
          ))}
          <span className="font-black uppercase text-secondary-fixed">{dictionary.finish}</span>
        </div>
      </div>

      <ol className="flex flex-col gap-1.5">
        {racers.map((racer, index) => {
          const isYou = racer.id === youId;
          const character = characterSprite(racer.character);
          const anchor = (character.anchorX / character.frameSize) * RUNNER_SIZE;
          const width = `${racer.progress * 100}%`;
          const label = formatMessage(dictionary.progress, {
            name: racer.name,
            percent: percent.format(racer.progress),
            wpm: number.format(racer.wpm),
          });

          return (
            <li
              key={racer.id}
              aria-label={label}
              className={`flex h-[76px] items-stretch bg-surface-container-highest ${racer.isConnected ? "" : "opacity-50"} ${
                overtakerIds?.has(racer.id) ? "lane-overtake" : ""
              }`}
            >
              {/* The course: everything here is decorative and placed from progress only. */}
              <div aria-hidden="true" className="@container relative flex-1 overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 transition-[width] duration-300 ${
                    isYou
                      ? "bg-gradient-to-r from-primary-container/5 via-primary-container/25 to-primary-container/50"
                      : "bg-gradient-to-r from-primary-container/0 via-primary-container/10 to-primary-container/25"
                  }`}
                  style={{ width }}
                />
                <div className="absolute inset-x-0 bottom-1 h-px bg-on-surface/25" />
                {/* The exit: a light at the end of the lane, brighter as the leader nears it. */}
                <div
                  className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-secondary-fixed/45 to-transparent transition-opacity duration-500"
                  style={{ opacity: exitGlow }}
                />
                <div
                  className={`absolute inset-y-1 right-0 w-1.5 bg-secondary-fixed shadow-[0_0_14px_4px_var(--color-secondary-fixed)] transition-opacity duration-500 ${
                    exitGlow > 0.6 ? "motion-safe:animate-pulse" : ""
                  }`}
                  style={{ opacity: 0.2 + 0.8 * exitGlow }}
                />
                {chaos &&
                  laneStones(index).map((stone, stoneIndex) => (
                    <div
                      key={stoneIndex}
                      className="lane-stone absolute bottom-1 -skew-x-12 bg-surface-bright shadow-[1px_1px_0_var(--color-primary-container)]"
                      style={
                        {
                          left: stone.left,
                          width: stone.size,
                          height: stone.size,
                          "--stone-duration": stone.duration,
                          "--stone-delay": stone.delay,
                        } as CSSProperties
                      }
                    />
                  ))}
                {RUNNER_OBSTACLES.map((obstacle) => (
                  <div
                    key={obstacle}
                    className="absolute bottom-1 h-3 w-2.5 -translate-x-1/2 -skew-x-12 bg-primary-container shadow-hard-xs"
                    style={{ left: `calc(${obstacle} * (100% - ${RUNNER_SIZE}px) + ${anchor}px)` }}
                  />
                ))}
                <div
                  className="absolute top-1 left-0 flex -skew-x-12 items-center gap-1 px-2 py-0.5 transition-[left,translate] duration-300 motion-reduce:transition-none"
                  style={{ left: width, translate: `-${width}` }}
                >
                  <span
                    className={`skew-x-12 font-hud text-[13px] font-black uppercase tracking-widest ${
                      isYou ? "text-secondary-fixed" : "text-secondary"
                    }`}
                  >
                    {racer.name}
                  </span>
                  {racer.isBot && <Icon name="smart_toy" size={14} className="skew-x-12 text-outline" />}
                  {isYou && (
                    <span className="skew-x-12 bg-secondary-fixed px-1 font-hud text-[10px] font-black uppercase text-on-secondary-fixed">
                      {dictionary.you}
                    </span>
                  )}
                </div>
                <div
                  className="absolute bottom-0 left-0 transition-[translate] duration-300 ease-linear motion-reduce:transition-none"
                  style={{ translate: `calc(${racer.progress} * (100cqw - 100%)) 0` }}
                >
                  <RaceRunner
                    character={character}
                    progress={racer.progress}
                    wpm={racer.wpm}
                    isFinished={racer.isFinished}
                    mistakes={racer.mistakes}
                    isYou={isYou}
                    now={now}
                  />
                </div>
              </div>

              {/* Fixed width so every lane's course has the same length. */}
              <div aria-hidden="true" className="flex w-52 shrink-0 items-center justify-end gap-4 px-3">
                <span className="font-hud text-[17px] font-black tracking-widest text-secondary">
                  {formatMessage(dictionary.wpmValue, { wpm: number.format(racer.wpm) })}
                </span>
                <span className="w-10 text-right font-hud text-label-hud font-black text-secondary-fixed">
                  {percent.format(racer.progress)}
                </span>
                <span className="font-display text-[14px] tracking-wider text-secondary-fixed">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
