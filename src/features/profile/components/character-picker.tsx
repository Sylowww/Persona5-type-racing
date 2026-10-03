import { Icon } from "@/components/ui/icon";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { characterIds, characters } from "@/lib/characters";
import type { CharacterId } from "@/types/character";
import { chooseCharacter } from "../actions";

const PORTRAIT_SIZE = 96;

type CharacterPickerProps = {
  dictionary: Dictionary["profile"]["character"];
  selected: CharacterId;
};

// Plain form buttons: picking works without client JavaScript.
export function CharacterPicker({ dictionary, selected }: CharacterPickerProps) {
  return (
    <section className="flex flex-col gap-3 bg-surface-container p-5 shadow-hard-md shadow-secondary">
      <h2 className="font-hud text-headline-sm font-black uppercase italic tracking-wider text-secondary">{dictionary.title}</h2>
      <p className="text-[13px] text-on-surface-variant">{dictionary.hint}</p>
      <form action={chooseCharacter} className="grid grid-cols-2 gap-3">
        {characterIds.map((id) => {
          const character = characters[id];
          const isSelected = id === selected;
          return (
            <button
              key={id}
              type="submit"
              name="character"
              value={id}
              aria-pressed={isSelected}
              className={`flex cursor-pointer flex-col items-center gap-1 bg-surface-container-lowest p-2 transition-colors hover:bg-surface-container-highest focus-visible:outline-2 focus-visible:outline-secondary-fixed ${
                isSelected ? "outline-2 outline-secondary-fixed" : ""
              }`}
            >
              {/* First idle frame of the sprite sheet. */}
              <span
                aria-hidden="true"
                className="block bg-no-repeat"
                style={{
                  width: PORTRAIT_SIZE,
                  height: PORTRAIT_SIZE,
                  backgroundImage: `url(${character.src})`,
                  backgroundSize: `${character.columns * PORTRAIT_SIZE}px ${character.rows * PORTRAIT_SIZE}px`,
                }}
              />
              <span className="font-hud text-label-hud font-black uppercase tracking-widest text-secondary">{dictionary.names[id]}</span>
              <span
                className={`flex h-4 items-center gap-1 font-hud text-[10px] font-black uppercase ${isSelected ? "text-secondary-fixed" : "text-transparent"}`}
              >
                {isSelected && <Icon name="check" size={14} />}
                {dictionary.selected}
              </span>
            </button>
          );
        })}
      </form>
    </section>
  );
}
