"use client";

import Link from "next/link";
import { type MouseEvent, type ReactNode, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Tilt } from "@/components/ui/tilt";
import { TarotBack, TarotCard, RankPips, rankLines } from "@/features/characters/components/tarot-card";
import { chooseCharacter } from "@/features/profile/actions";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { formatMessage } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import type { AchievementState } from "@/lib/achievements";
import { characterIds } from "@/lib/characters";
import { CONFIDANT_MAX_RANK, arcanaNumerals, characterArcana, compendiumProgress, confidantRank, confidantRewards, hasReward } from "@/lib/confidants";
import type { CharacterId } from "@/types/character";
import type { PlayerStats } from "@/types/race";
import { AchievementCard } from "./achievement-card";

type CompendiumProps = {
  dictionary: Dictionary["compendium"];
  confidants: Dictionary["confidants"];
  names: Dictionary["profile"]["character"]["names"];
  locale: Locale;
  /** The player's stats with each thief; null for guests and visitors (no saved races, every card face down). */
  stats: Partial<Record<CharacterId, PlayerStats>> | null;
  /** The thief in play (the owner's), or null for guests and visitors. */
  chosen: CharacterId | null;
  /** Achievement cards; null for guests and visitors. */
  achievements: readonly AchievementState[] | null;
  /** The owner's name when viewing another player's compendium (read only), null for the player's own. */
  owner: string | null;
};

// Each card sits at its own small angle, like cards laid out on a table.
const tilts = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"] as const;

/**
 * Every thief's confidant card: face down until the player races as that thief, face up with its rank after, with a
 * permanent foil at MAX. Clicking a card opens it in front of the page: it turns over to the stats with that thief, and
 * can be played (chosen as the player's thief).
 */
export function Compendium({ dictionary, confidants, names, locale, stats, chosen, achievements, owner }: CompendiumProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [inspected, setInspected] = useState<CharacterId | null>(null);
  const [flipped, setFlipped] = useState(false);
  const races = (id: CharacterId) => stats?.[id]?.races ?? 0;
  const progress = compendiumProgress(Object.fromEntries(characterIds.map((id) => [id, races(id)])), characterIds);
  const titles = characterIds.filter((id) => hasReward(confidantRank(races(id)).rank, "title")).map((id) => formatMessage(confidants.title, { name: names[id] }));

  function inspect(id: CharacterId) {
    setInspected(id);
    setFlipped(false);
    dialog.current?.showModal();
  }

  // A click on the dimmed backdrop (the dialog box itself, outside its content) closes it.
  function onDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) event.currentTarget.close();
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4">
        <span className="eyebrow">{dictionary.eyebrow}</span>
        <h1 className="w-fit -rotate-2 font-display text-[clamp(48px,7vw,96px)] uppercase italic leading-none text-secondary [text-shadow:6px_6px_0_var(--color-primary-container)]">
          {owner ? formatMessage(dictionary.ownerTitle, { name: owner }) : dictionary.title}
        </h1>
        <p className="max-w-2xl text-body-md text-on-surface">{owner ? formatMessage(dictionary.ownerIntro, { name: owner }) : dictionary.intro}</p>
        {owner && (
          <Link href={`/${locale}/compendium`} className="btn-ghost w-fit">
            <Icon name="style" size={18} />
            {dictionary.mine}
          </Link>
        )}
        {stats ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="-skew-x-12 bg-secondary-fixed px-3 py-0.5 font-display text-headline-sm uppercase text-on-secondary-fixed">
              {formatMessage(dictionary.progress, progress)}
            </span>
            <span className="-skew-x-12 border-2 border-secondary-fixed px-3 font-display text-headline-sm uppercase text-secondary-fixed">
              {formatMessage(dictionary.maxed, { count: progress.maxed })}
            </span>
            <span aria-hidden="true" className="h-2 w-48 -skew-x-12 bg-surface-container-high">
              <span className="block h-full bg-primary-container" style={{ width: `${(progress.unlocked / progress.total) * 100}%` }} />
            </span>
            {titles.length > 0 && (
              <p className="flex flex-wrap items-center gap-2">
                <span className="eyebrow">{dictionary.titles}</span>
                {titles.map((title) => (
                  <span key={title} className="rotate-1 border-2 border-secondary bg-surface-container-lowest px-2 py-0.5 font-hud text-label-hud font-black uppercase tracking-widest text-secondary">
                    {title}
                  </span>
                ))}
              </p>
            )}
          </div>
        ) : (
          <p className="flex flex-wrap items-center gap-4 border-l-4 border-primary-container pl-4 text-body-md text-secondary">
            {dictionary.signIn}
            <Link href={`/${locale}/sign-in`} className="btn-primary">
              {dictionary.signInCta}
            </Link>
          </p>
        )}
      </header>

      <ul className="grid grid-cols-2 justify-items-center gap-x-6 gap-y-12 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {characterIds.map((id, index) => {
          const { rank } = confidantRank(races(id));
          return (
            <li key={id} className="flex flex-col items-center gap-3">
              <Tilt glare={rank === CONFIDANT_MAX_RANK ? "holo" : rank > 0 ? "shine" : "none"} max={12} className={tilts[index % tilts.length]}>
                <button
                  type="button"
                  onClick={() => inspect(id)}
                  disabled={stats === null}
                  aria-label={formatMessage(dictionary.inspect, { name: names[id] })}
                  className="block cursor-pointer [transform-style:preserve-3d] disabled:cursor-default"
                >
                  <CardFaces confidants={confidants} id={id} rank={rank} faceDown={rank === 0} back={<TarotBack numeral={arcanaNumerals[characterArcana[id]]} className="size-full" />} />
                </button>
                {chosen === id && (
                  <span className="tilt-pop absolute -top-3 -right-3 rotate-6 bg-primary-container px-2 py-0.5 font-hud text-label-hud font-black uppercase tracking-widest text-on-primary-container shadow-hard-sm">
                    {dictionary.inPlay}
                  </span>
                )}
              </Tilt>
              <span className="flex flex-col items-center">
                <span className="font-display text-headline-sm uppercase italic tracking-wider text-secondary">{names[id]}</span>
                <span className="font-hud text-label-hud font-black uppercase tracking-widest text-on-surface-variant">
                  {rank === 0 ? dictionary.faceDown : rank === CONFIDANT_MAX_RANK ? confidants.max : formatMessage(confidants.rank, { rank })}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      {achievements && (
        <section aria-labelledby="achievements-title" className="flex flex-col gap-6">
          <div className="flex flex-wrap items-baseline gap-4">
            <h2 id="achievements-title" className="font-display text-headline-lg uppercase italic text-secondary">
              {dictionary.achievementsTitle}
            </h2>
            <span className="-skew-x-12 bg-secondary-fixed px-3 font-display text-headline-sm uppercase text-on-secondary-fixed">
              {formatMessage(dictionary.achievementsProgress, { unlocked: achievements.filter((state) => state.unlocked).length, total: achievements.length })}
            </span>
          </div>
          <ul className="grid grid-cols-2 justify-items-center gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8">
            {achievements.map((state, index) => (
              <AchievementCard key={state.id} dictionary={dictionary} state={state} className={tilts[(index + 1) % tilts.length]} />
            ))}
          </ul>
        </section>
      )}

      <dialog
        ref={dialog}
        onClose={() => setInspected(null)}
        onClick={onDialogClick}
        aria-label={inspected ? names[inspected] : undefined}
        className="m-auto max-h-[calc(100svh-2rem)] w-[min(100%-2rem,760px)] overflow-visible bg-transparent text-secondary backdrop:bg-surface-container-lowest/85 backdrop:backdrop-blur-sm open:flex"
      >
        {inspected && (
          <Inspected
            key={inspected}
            dictionary={dictionary}
            confidants={confidants}
            locale={locale}
            id={inspected}
            name={names[inspected]}
            stats={stats?.[inspected] ?? null}
            isChosen={chosen === inspected}
            canPlay={owner === null}
            flipped={flipped}
            onFlip={() => setFlipped((value) => !value)}
            onClose={() => dialog.current?.close()}
          />
        )}
      </dialog>
    </div>
  );
}

type CardFacesProps = {
  confidants: Dictionary["confidants"];
  id: CharacterId;
  rank: number;
  width?: number;
  faceDown: boolean;
  /** What is printed on the back; it fills the card. */
  back: ReactNode;
};

/** A two-sided tarot card (`.flip-*` in globals.css): the confidant card in front, `back` behind. */
function CardFaces({ confidants, id, rank, width, faceDown, back }: CardFacesProps) {
  return (
    <span
      className={`flip-card relative block transition-transform duration-700 ease-[cubic-bezier(0.2,0.9,0.3,1.15)] motion-reduce:transition-none ${
        faceDown ? "[transform:rotateY(180deg)]" : ""
      }`}
    >
      <TarotCard dictionary={confidants} character={id} rank={rank} width={width} className={`flip-face ${rank === 0 ? "opacity-60 grayscale" : ""}`} />
      <span className="flip-face flip-back absolute inset-0 block">{back}</span>
    </span>
  );
}

type InspectedProps = {
  dictionary: Dictionary["compendium"];
  confidants: Dictionary["confidants"];
  locale: Locale;
  id: CharacterId;
  name: string;
  stats: PlayerStats | null;
  isChosen: boolean;
  /** False on another player's compendium: their cards can be looked at, not played. */
  canPlay: boolean;
  flipped: boolean;
  onFlip: () => void;
  onClose: () => void;
};

/** The card held up in front of the page: big, tilting, turning over to the stats with that thief. */
function Inspected({ dictionary, confidants, locale, id, name, stats, isChosen, canPlay, flipped, onFlip, onClose }: InspectedProps) {
  const races = stats?.races ?? 0;
  const { rank } = confidantRank(races);
  const lines = rankLines(confidants, races);
  const arcana = confidants.arcana[characterArcana[id]];
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const rows: [label: string, value: string][] = [
    [dictionary.stats.races, number.format(races)],
    [dictionary.stats.wins, number.format(stats?.wins ?? 0)],
    [dictionary.stats.bestWpm, number.format(stats?.bestWpm ?? 0)],
    [dictionary.stats.averageWpm, number.format(stats?.averageWpm ?? 0)],
    [dictionary.stats.accuracy, percent.format(stats?.accuracy ?? 0)],
  ];

  return (
    <div className="flex w-full flex-col items-center gap-8 sm:flex-row sm:items-center sm:gap-12">
      <Tilt glare={rank > 0 ? "holo" : "none"} max={10} className="card-swing shrink-0 -rotate-2">
        <button type="button" onClick={onFlip} aria-label={dictionary.flip} aria-pressed={flipped} className="block cursor-pointer [transform-style:preserve-3d]">
          <CardFaces
            confidants={confidants}
            id={id}
            rank={rank}
            width={240}
            faceDown={flipped}
            back={
              <span className="flex size-full flex-col gap-3 border-2 border-secondary-fixed bg-surface-container-lowest p-4 text-left">
                <span className="font-display text-headline-sm uppercase italic tracking-wider text-secondary-fixed">
                  {formatMessage(dictionary.statsTitle, { name })}
                </span>
                <dl className="flex flex-1 flex-col justify-center gap-2">
                  {rows.map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-2 border-b border-surface-container-high pb-1">
                      <dt className="font-hud text-label-hud font-black uppercase tracking-widest text-on-surface-variant">{label}</dt>
                      <dd className="font-display text-headline-sm text-secondary tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
                <RankPips rank={rank} />
              </span>
            }
          />
        </button>
      </Tilt>

      <div className="flex flex-col items-center gap-4 sm:items-start">
        <span className="eyebrow">{`${confidants.label} // ${formatMessage(confidants.arcanaLabel, { arcana })}`}</span>
        <p className="-rotate-2 border-4 border-secondary-fixed bg-surface-container-lowest px-5 py-1 font-display text-headline-lg uppercase italic tracking-wider text-secondary-fixed shadow-hard-md">
          {name}
        </p>
        <p className="-skew-x-12 bg-secondary-fixed px-3 font-display text-headline-sm uppercase text-on-secondary-fixed">
          {rank === 0 ? dictionary.faceDown : lines.rank}
        </p>
        <p className="font-hud text-label-hud font-black uppercase tracking-widest text-on-surface-variant">
          {rank === 0 ? formatMessage(confidants.none, { name }) : lines.next}
        </p>

        <div className="flex flex-col gap-1">
          <span className="eyebrow">{dictionary.rewardsTitle}</span>
          <ul className="flex flex-col gap-1">
            {confidantRewards.map(({ rank: needed, reward }) => {
              const earned = rank >= needed;
              return (
                <li key={reward} className={`flex items-center gap-2 font-hud text-label-hud font-black uppercase tracking-widest ${earned ? "text-secondary-fixed" : "text-outline"}`}>
                  <Icon name={earned ? "check" : "lock"} size={16} />
                  <span className="w-16 shrink-0">{formatMessage(dictionary.rewardRank, { rank: needed })}</span>
                  {formatMessage(dictionary.rewards[reward], { title: formatMessage(confidants.title, { name }) })}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          {!canPlay ? null : isChosen ? (
            <p className="flex items-center gap-2 border-2 border-secondary-fixed px-4 py-2 font-hud text-label-hud font-black uppercase tracking-widest text-secondary-fixed">
              <Icon name="check" size={18} />
              {dictionary.playing}
            </p>
          ) : (
            <form action={chooseCharacter}>
              <button type="submit" name="character" value={id} className="btn-primary shadow-hard-md">
                <Icon name="bolt" size={20} />
                {dictionary.play}
              </button>
            </form>
          )}
          <button type="button" onClick={onFlip} className="btn-ghost">
            <Icon name="refresh" size={18} />
            {dictionary.flip}
          </button>
          <button type="button" onClick={onClose} className="btn-ghost">
            {dictionary.close}
          </button>
        </div>
      </div>
    </div>
  );
}
