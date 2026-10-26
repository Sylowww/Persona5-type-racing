"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type MouseEvent, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { SpriteFrames } from "@/components/ui/sprite-frames";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { formatMessage } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { characterAllOutPortrait, characterIds, characterPortrait, characters, isCharacterId } from "@/lib/characters";
import { characterPersonas } from "@/lib/spells";
import type { CharacterId } from "@/types/character";
import { chooseCharacter } from "@/features/profile/actions";

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
};

/** One thief's calling-card file: name plate, profile, Persona and art on a red comic stage, then the roster. */
export function CharacterFile({ dictionary, names, locale, initialId, titleSuffix, chosen }: CharacterFileProps) {
  // Switching thieves only rewrites the URL (see `select`), so the shown thief follows the path, back button included.
  const segment = usePathname().split("/").pop();
  const id = isCharacterId(segment) ? segment : initialId;
  const index = characterIds.indexOf(id);
  const previous = characterIds[(index - 1 + characterIds.length) % characterIds.length];
  const next = characterIds[(index + 1) % characterIds.length];
  const href = (characterId: CharacterId) => `/${locale}/characters/${characterId}`;

  useEffect(() => {
    document.title = `${names[id]}${titleSuffix}`;
  }, [id, names, titleSuffix]);

  // Every thief's data is already here: swap in place instead of loading the page again. The links still work without JavaScript.
  function select(event: MouseEvent<HTMLAnchorElement>, characterId: CharacterId) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (characterId !== id) window.history.pushState(null, "", href(characterId));
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
          </div>

          <div className="relative flex flex-col items-center gap-8 pb-20 lg:min-h-[560px] lg:justify-center lg:pb-0">
            <div className="relative size-[260px] rotate-6 bg-secondary p-2 shadow-[10px_10px_0_var(--color-surface-container-lowest)] md:size-[340px]">
              <div className="relative size-full overflow-hidden [clip-path:polygon(6%_0,100%_0,94%_100%,0_100%)]">
                <Image src={characterAllOutPortrait(id)} alt="" fill sizes="340px" className="object-cover" priority />
              </div>
            </div>

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
