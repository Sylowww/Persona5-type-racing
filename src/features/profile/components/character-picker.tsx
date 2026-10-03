import { Icon } from "@/components/ui/icon";
import { SpriteFrames } from "@/components/ui/sprite-frames";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { characterIds, characters } from "@/lib/characters";
import type { CharacterId } from "@/types/character";
import { chooseCharacter } from "../actions";

type CharacterPickerProps = {
  dictionary: Dictionary["profile"]["character"];
  selected: CharacterId;
};

// Plain form buttons: picking works without client JavaScript.
export function CharacterPicker({ dictionary, selected }: CharacterPickerProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="-skew-x-6 bg-secondary px-3 py-1 font-display text-headline-sm uppercase italic tracking-wider text-surface-container-lowest shadow-hard-md shadow-primary-container md:text-headline-md">
          {dictionary.title}
        </h2>
        <p className="max-w-md text-[13px] text-on-surface-variant">{dictionary.hint}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Showcase dictionary={dictionary} selected={selected} />

        <form action={chooseCharacter} className="grid grid-cols-3 gap-3 self-start">
          {characterIds.map((id) => (
            <RosterCard key={id} id={id} name={dictionary.names[id]} isSelected={id === selected} />
          ))}
        </form>
      </div>
    </section>
  );
}

/** The chosen character, large and animated, on a tilted red calling-card panel. */
function Showcase({ dictionary, selected }: CharacterPickerProps) {
  return (
    <div className="relative min-h-[300px]">
      <div className="absolute -inset-1 translate-x-2 translate-y-2 rotate-[1.5deg] bg-surface-container-lowest" />
      <div className="relative flex h-full min-h-[300px] -rotate-1 flex-col justify-end overflow-hidden bg-primary-container shadow-hard-xl">
        {/* Speed lines behind the character. */}
        <div aria-hidden="true" className="absolute inset-0 opacity-25">
          <div className="absolute -inset-x-10 top-[18%] h-6 -rotate-12 bg-surface-container-lowest" />
          <div className="absolute -inset-x-10 top-[38%] h-14 -rotate-12 bg-surface-container-lowest" />
          <div className="absolute -inset-x-10 top-[64%] h-3 -rotate-12 bg-secondary" />
        </div>
        <span className="absolute top-3 right-3 flex rotate-3 items-center gap-1 bg-secondary-fixed px-2 py-0.5 font-hud text-label-hud font-black uppercase tracking-widest text-on-secondary-fixed shadow-hard-xs">
          <Icon name="check" size={16} />
          {dictionary.selected}
        </span>

        <SpriteFrames
          character={characters[selected]}
          animation="idle"
          size={224}
          className="mx-auto -mb-2 drop-shadow-[4px_4px_0_var(--color-surface-container-lowest)]"
        />

        <div className="relative -mt-6 px-4 pb-4">
          <span className="font-hud text-label-hud font-black uppercase tracking-widest text-on-primary-container">
            {dictionary.codename}
          </span>
          <p className="-skew-x-6 font-display text-headline-lg uppercase italic leading-none tracking-wider text-secondary [text-shadow:4px_4px_0_var(--color-surface-container-lowest)]">
            {dictionary.names[selected]}
          </p>
        </div>
      </div>
    </div>
  );
}

function RosterCard({ id, name, isSelected }: { id: CharacterId; name: string; isSelected: boolean }) {
  return (
    <button
      type="submit"
      name="character"
      value={id}
      aria-pressed={isSelected}
      className="group relative flex cursor-pointer flex-col items-center pt-1 transition-transform hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-none motion-reduce:transition-none"
    >
      {/* Tilted card face; only the background is skewed so the sprite stays upright. */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 -skew-x-6 overflow-hidden transition-colors ${
          isSelected
            ? "bg-primary-container shadow-hard-md shadow-secondary-fixed"
            : "bg-surface-container-low shadow-hard-sm group-hover:bg-surface-container-high group-focus-visible:outline-2 group-focus-visible:outline-secondary-fixed"
        }`}
      >
        <span
          className={`absolute -inset-x-6 top-1/2 h-8 -rotate-12 ${
            isSelected ? "bg-surface-container-lowest/25" : "bg-primary-container/15 group-hover:bg-primary-container/40"
          }`}
        />
      </span>

      <SpriteFrames
        character={characters[id]}
        animation="idle"
        size={120}
        className="relative"
        stripClassName={isSelected ? "" : "[animation-play-state:paused] group-hover:[animation-play-state:running] group-focus-visible:[animation-play-state:running]"}
      />

      <span
        className={`relative mb-2 -mt-3 -skew-x-6 px-2 py-0.5 font-hud text-label-hud font-black uppercase tracking-widest shadow-hard-xs ${
          isSelected ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-secondary text-surface-container-lowest"
        }`}
      >
        {name}
      </span>
    </button>
  );
}
