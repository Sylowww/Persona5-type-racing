"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { SpriteFrames } from "@/components/ui/sprite-frames";
import { Tilt } from "@/components/ui/tilt";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { formatMessage } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { characterAllOutPortrait, characterIds, characterPortrait, characters, isCharacterId } from "@/lib/characters";
import { characterPersonas } from "@/lib/spells";
import type { CharacterId } from "@/types/character";
import { chooseCharacter } from "@/features/profile/actions";
import { RankPips, TarotCard, rankLines } from "@/features/characters/components/tarot-card";
import { arcanaNumerals, characterArcana, confidantRank } from "@/lib/confidants";

type CharacterFileProps = {
  dictionary: Dictionary["characters"];
  names: Dictionary["profile"]["character"]["names"];
  locale: Locale;
  /** The thief in the URL when the page was loaded. */
  initialId: CharacterId;
  /** Rest of the tab title after the codename (" - Phantom Thieves - TYPE//STRIKE"). */
  titleSuffix: string;
  /** The signed-in player's thief, or null for guests and visitors (they cannot choose one). */
  chosen: CharacterId | null;
  confidants: Dictionary["confidants"];
  /** Saved races with each thief (confidant bonds); null for guests and visitors. */
  bonds: Partial<Record<CharacterId, number>> | null;
};

/** One thief's calling-card file: name plate, profile, Persona and art on a red comic stage, then the roster. */
export function CharacterFile({ dictionary, names, locale, initialId, titleSuffix, chosen, confidants, bonds }: CharacterFileProps) {
  // The shown thief follows the path (back button included), and switches at once on a click, before the router
  // catches up (see `select`).
  const router = useRouter();
  const segment = usePathname().split("/").pop();
  const pathId = isCharacterId(segment) ? segment : initialId;
  const [picked, setPicked] = useState<{ id: CharacterId; from: CharacterId } | null>(null);
  // The thief whose portrait is turned over; picking another thief shows the next one face up.
  const [flipped, setFlipped] = useState<CharacterId | null>(null);
  // A click picks a thief until the path changes (to it, or back/forward to another one).
  const id = picked && picked.from === pathId ? picked.id : pathId;
  const index = characterIds.indexOf(id);
  const previous = characterIds[(index - 1 + characterIds.length) % characterIds.length];
  const next = characterIds[(index + 1) % characterIds.length];
  const href = (characterId: CharacterId) => `/${locale}/characters/${characterId}`;

  useEffect(() => {
    document.title = `${names[id]}${titleSuffix}`;
  }, [id, names, titleSuffix]);

  // Every thief's data is already here: swap in place right away, then let the router follow without scrolling to the
  // top (a plain history.pushState would make Next.js navigate and jump up). The links still work without JavaScript.
  function select(event: MouseEvent<HTMLAnchorElement>, characterId: CharacterId) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (characterId === id) return;
    setPicked({ id: characterId, from: pathId });
    router.push(href(characterId), { scroll: false });
  }

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="character-name" className="relative overflow-clip border-t-4 border-primary-container bg-surface-container-low">
        <Stage />

        <div className="relative grid gap-10 px-5 py-10 md:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:py-14">
          <div className="flex flex-col gap-8">
            <p className="w-fit -rotate-6 font-display text-[clamp(48px,7vw,104px)] uppercase leading-none text-secondary [text-shadow:6px_6px_0_var(--color-primary-container)]">
              {dictionary.title}
            </p>

            <div className="flex w-fit -rotate-3 flex-col items-start">
              <h1
                id="character-name"
                className="border-4 border-secondary-fixed bg-surface-container-lowest px-6 py-2 font-display text-[clamp(44px,6vw,80px)] uppercase italic leading-tight tracking-wider text-secondary-fixed shadow-hard-lg"
              >
                {names[id]}
              </h1>
              <p className="-mt-1 ml-8 -rotate-3 bg-secondary-fixed px-3 py-1 font-hud text-[15px] font-black uppercase tracking-wider text-on-secondary-fixed shadow-hard-sm">
                {formatMessage(dictionary.realName, { name: dictionary.realNames[id] })}
              </p>
            </div>

            <div className="flex max-w-xl flex-col items-start">
              <h2 className="border-2 border-b-0 border-secondary-fixed bg-surface-container-lowest px-4 py-1 font-display text-headline-sm uppercase tracking-wider text-secondary-fixed">
                {dictionary.profile}
              </h2>
              <p className="border-2 border-secondary-fixed bg-surface-container-lowest p-5 text-[17px] leading-relaxed text-secondary shadow-[8px_8px_0_var(--color-secondary-fixed)]">
                {dictionary.bios[id]}
              </p>
            </div>

            <ChooseButton dictionary={dictionary} locale={locale} id={id} name={names[id]} chosen={chosen} />

            {bonds && <ConfidantBond dictionary={confidants} id={id} name={names[id]} races={bonds[id] ?? 0} />}
          </div>

          <div className="relative flex flex-col items-center gap-8 pb-20 lg:min-h-[560px] lg:justify-center lg:pb-0">
            <PortraitCard
              key={id}
              id={id}
              label={dictionary.flip}
              persona={dictionary.persona}
              arcana={confidants.arcana[characterArcana[id]]}
              flipped={flipped === id}
              onFlip={() => setFlipped(flipped === id ? null : id)}
            />

            <div className="absolute bottom-0 left-0 md:left-4">
              <SpriteFrames character={characters[id]} animation="idle" size={224} className="drop-shadow-[4px_4px_0_var(--color-surface-container-lowest)]" />
            </div>

            <div className="z-10 order-first flex max-w-[260px] flex-col items-end self-end lg:absolute lg:top-0 lg:right-0">
              <span className="rotate-3 bg-secondary-fixed px-3 py-0.5 font-hud text-label-hud font-black uppercase tracking-widest text-on-secondary-fixed">
                {dictionary.persona}
              </span>
              <p className="-rotate-2 border-2 border-secondary-fixed bg-surface-container-lowest px-5 py-1 font-display text-headline-md uppercase italic tracking-wider text-secondary-fixed shadow-hard-md">
                {characterPersonas[id]}
              </p>
              <p className="mt-3 text-right text-[12px] text-secondary">{dictionary.personaHint}</p>
            </div>

            <div className="absolute right-0 bottom-0 flex gap-2">
              <ArrowLink href={href(previous)} label={dictionary.previous} icon="chevron_left" onClick={(event) => select(event, previous)} />
              <ArrowLink href={href(next)} label={dictionary.next} icon="chevron_right" onClick={(event) => select(event, next)} />
            </div>
          </div>
        </div>
      </section>

      <nav aria-label={dictionary.roster}>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-12">
          {characterIds.map((characterId) => {
            const isCurrent = characterId === id;
            return (
              <li key={characterId}>
                <Link
                  href={href(characterId)}
                  onClick={(event) => select(event, characterId)}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`group flex flex-col items-center gap-1 border-2 p-1 pb-2 transition-colors ${
                    isCurrent ? "border-secondary-fixed bg-primary-container" : "border-surface-container-high bg-surface-container-low hover:border-primary-container"
                  }`}
                >
                  <Image src={characterPortrait(characterId)} alt="" width={96} height={96} className="aspect-square w-full object-cover" />
                  <span
                    className={`font-hud text-label-hud font-black uppercase tracking-wider ${
                      isCurrent ? "text-on-primary-container" : "text-on-surface-variant group-hover:text-secondary"
                    }`}
                  >
                    {names[characterId]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

type PortraitCardProps = {
  id: CharacterId;
  label: string;
  persona: string;
  arcana: string;
  flipped: boolean;
  onFlip: () => void;
};

/**
 * The all-out portrait in its tilted white frame, as a card: a click turns it over to the Persona and arcana on the
 * back. Remounted per thief, so a newly picked one swings in (`.character-swap`, `.flip-*` in globals.css).
 */
function PortraitCard({ id, label, persona, arcana, flipped, onFlip }: PortraitCardProps) {
  return (
    <button
      type="button"
      onClick={onFlip}
      aria-label={label}
      aria-pressed={flipped}
      className="group relative size-[260px] rotate-6 cursor-pointer [perspective:1200px] md:size-[340px]"
    >
      <span
        className={`character-swap flip-card relative block size-full transition-transform duration-700 ease-[cubic-bezier(0.2,0.9,0.3,1.15)] motion-reduce:transition-none ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        <span className="flip-face absolute inset-0 bg-secondary p-2 shadow-[10px_10px_0_var(--color-surface-container-lowest)]">
          <span className="relative block size-full overflow-hidden [clip-path:polygon(6%_0,100%_0,94%_100%,0_100%)]">
            <Image src={characterAllOutPortrait(id)} alt="" fill sizes="340px" className="object-cover" priority />
          </span>
        </span>
        <span className="flip-face flip-back halftone absolute inset-0 flex flex-col items-center justify-center gap-4 border-8 border-secondary bg-primary-container p-6 shadow-[-10px_10px_0_var(--color-surface-container-lowest)]">
          <span className="font-display text-[56px] leading-none text-secondary-fixed [text-shadow:4px_4px_0_var(--color-surface-container-lowest)]">
            {arcanaNumerals[characterArcana[id]]}
          </span>
          <span className="-rotate-3 bg-surface-container-lowest px-4 py-1 font-display text-headline-md uppercase italic tracking-wider text-secondary-fixed">
            {characterPersonas[id]}
          </span>
          <span className="font-hud text-label-hud font-black uppercase tracking-widest text-on-primary-container">{persona}</span>
          <span className="font-display text-headline-sm uppercase tracking-wider text-secondary">{arcana}</span>
        </span>
      </span>
      <span
        aria-hidden="true"
        className="absolute -top-3 -left-3 flex size-10 items-center justify-center border-2 border-secondary-fixed bg-surface-container-lowest text-secondary-fixed shadow-hard-sm transition-colors group-hover:bg-secondary-fixed group-hover:text-on-secondary-fixed"
      >
        <Icon name="refresh" size={22} />
      </span>
    </button>
  );
}

/** Red comic bands and halftone dots behind the file, like a Persona 5 character screen. */
function Stage() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-clip">
      <div className="absolute inset-0 bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-primary-container/40" />
      <div className="halftone absolute -inset-x-1/4 top-[8%] h-[38%] -rotate-[24deg] bg-primary-container/80" />
      <div className="halftone absolute -inset-x-1/4 top-[58%] h-[22%] -rotate-[24deg] bg-primary-container/60" />
      <div className="absolute -inset-x-1/4 top-[50%] h-2 -rotate-[24deg] bg-secondary-fixed/70" />
    </div>
  );
}

type ArrowLinkProps = {
  href: string;
  label: string;
  icon: "chevron_left" | "chevron_right";
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
};

function ArrowLink({ href, label, icon, onClick }: ArrowLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={label}
      className="flex size-14 -skew-x-12 items-center justify-center border-2 border-secondary-fixed bg-surface-container-lowest text-secondary-fixed shadow-hard-md transition-colors hover:bg-secondary-fixed hover:text-on-secondary-fixed"
    >
      <Icon name={icon} size={36} className="skew-x-12" />
    </Link>
  );
}

type ChooseButtonProps = Pick<CharacterFileProps, "dictionary" | "locale" | "chosen"> & { id: CharacterId; name: string };

function ChooseButton({ dictionary, locale, id, name, chosen }: ChooseButtonProps) {
  if (chosen === id) {
    return (
      <p className="flex w-fit items-center gap-2 border-2 border-secondary-fixed px-4 py-2 font-hud text-label-hud font-black uppercase tracking-widest text-secondary-fixed">
        <Icon name="check" size={18} />
        {dictionary.selected}
      </p>
    );
  }

  if (chosen === null) {
    return (
      <Link href={`/${locale}/sign-in`} className="btn-ghost w-fit px-5 py-2.5">
        {formatMessage(dictionary.signInToChoose, { name })}
      </Link>
    );
  }

  // A plain form: choosing works without client JavaScript.
  return (
    <form action={chooseCharacter}>
      <button type="submit" name="character" value={id} className="btn-primary flex items-center gap-2 shadow-hard-md">
        <Icon name="bolt" size={20} />
        {formatMessage(dictionary.choose, { name })}
      </button>
    </form>
  );
}

/** The player's confidant bond with this thief: the arcana card, rank pips and races left before the next rank. */
function ConfidantBond({ dictionary, id, name, races }: { dictionary: Dictionary["confidants"]; id: CharacterId; name: string; races: number }) {
  const { rank } = confidantRank(races);
  const lines = rankLines(dictionary, races);
  return (
    <section aria-labelledby="confidant-title" className="flex items-center gap-5">
      <Tilt glare={rank === 0 ? "none" : "holo"} max={14} className="-rotate-3">
        <TarotCard dictionary={dictionary} character={id} rank={rank} className={rank === 0 ? "opacity-50 grayscale" : ""} />
      </Tilt>
      <div className="flex flex-col items-start gap-2">
        <h2 id="confidant-title" className="eyebrow">
          {`${dictionary.label} // ${formatMessage(dictionary.arcanaLabel, { arcana: dictionary.arcana[characterArcana[id]] })}`}
        </h2>
        {rank === 0 ? (
          <p className="text-body-md text-secondary">{formatMessage(dictionary.none, { name })}</p>
        ) : (
          <>
            <p className="-skew-x-12 bg-secondary-fixed px-3 font-display text-headline-sm uppercase text-on-secondary-fixed">{lines.rank}</p>
            <RankPips rank={rank} />
            <p className="font-hud text-label-hud font-black uppercase tracking-widest text-on-surface-variant">{lines.next}</p>
          </>
        )}
      </div>
    </section>
  );
}
