import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { SpriteFrames } from "@/components/ui/sprite-frames";
import { Tilt } from "@/components/ui/tilt";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { formatMessage } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import { characterAllOutPortrait, characters } from "@/lib/characters";
import { characterPersonas } from "@/lib/spells";
import type { CharacterId } from "@/types/character";

type PhantomShowcaseProps = {
  dictionary: Dictionary["home"]["showcase"];
  name: string;
  locale: Locale;
  character: CharacterId;
};

/**
 * The player's thief standing next to the menu, like the leader on the Persona 5 title screen; opens their character
 * file. It leans toward the mouse, with the sprite and name plates floating in front of the portrait.
 */
export function PhantomShowcase({ dictionary, name, locale, character }: PhantomShowcaseProps) {
  return (
    <Tilt glare="none" max={10} className="mx-auto w-full max-w-[520px]">
      <Link href={`/${locale}/characters/${character}`} className="group relative block w-full [transform-style:preserve-3d]">
        {/* Red starburst behind the portrait. */}
        <span
          aria-hidden="true"
          className="halftone absolute -inset-[6%] bg-primary-container transition-transform duration-300 [clip-path:polygon(50%_0,62%_22%,88%_6%,80%_34%,100%_42%,82%_58%,96%_88%,66%_78%,52%_100%,40%_80%,8%_94%,18%_62%,0_48%,20%_34%,6%_8%,36%_20%)] group-hover:rotate-6 motion-reduce:transition-none"
        />

        <span className="relative block aspect-square p-[14%]">
          <span className="relative block size-full -rotate-6 bg-secondary p-2 shadow-[10px_10px_0_var(--color-surface-container-lowest)] transition-transform duration-300 group-hover:-rotate-3 motion-reduce:transition-none">
            <span className="relative block size-full overflow-hidden [clip-path:polygon(6%_0,100%_0,94%_100%,0_100%)]">
              <Image src={characterAllOutPortrait(character)} alt="" fill sizes="(min-width: 1280px) 400px, 80vw" className="object-cover" />
            </span>
          </span>
        </span>

        <span aria-hidden="true" className="tilt-pop absolute -bottom-2 -left-2 [--tilt-pop:70px] md:left-0">
          <SpriteFrames character={characters[character]} animation="idle" size={160} className="drop-shadow-[4px_4px_0_var(--color-surface-container-lowest)]" />
        </span>

        <span className="tilt-pop absolute top-2 right-0 flex flex-col items-end">
          <span className="rotate-3 bg-secondary-fixed px-3 py-0.5 font-hud text-label-hud font-black uppercase tracking-widest text-on-secondary-fixed">
            {dictionary.tape}
          </span>
          <span className="-rotate-2 border-4 border-secondary-fixed bg-surface-container-lowest px-4 py-1 font-display text-headline-lg uppercase italic leading-tight tracking-wider text-secondary-fixed shadow-hard-md">
            {name}
          </span>
          <span className="mt-1 -rotate-2 bg-surface-container-lowest px-2 py-0.5 font-hud text-label-hud font-black uppercase tracking-widest text-secondary">
            {formatMessage(dictionary.persona, { name: characterPersonas[character] })}
          </span>
        </span>

        <span className="tilt-pop absolute right-2 bottom-4 flex -skew-x-12 items-center gap-1 border-2 border-secondary bg-surface-container-lowest px-3 py-1 font-hud text-label-hud font-black uppercase tracking-widest text-secondary transition-colors group-hover:border-secondary-fixed group-hover:text-secondary-fixed">
          {dictionary.change}
          <Icon name="arrow_forward" size={16} />
        </span>
      </Link>
    </Tilt>
  );
}
