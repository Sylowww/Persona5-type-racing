import { Icon } from "@/components/ui/icon";
import type { Dictionary } from "@/i18n/dictionaries/en";

// Race results are not persisted yet, so the record is always empty for now.
export function ProfileStats({ dictionary }: { dictionary: Dictionary["profile"]["stats"] }) {
  const tiles = [
    { label: dictionary.races, value: "0" },
    { label: dictionary.record, value: "—" },
    { label: dictionary.average, value: "—" },
    { label: dictionary.accuracy, value: "—" },
  ];

  return (
    <section className="flex flex-col gap-4 bg-surface-container p-5 shadow-hard-md shadow-secondary">
      <h2 className="font-hud text-headline-sm font-black uppercase italic tracking-wider text-secondary">{dictionary.title}</h2>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="flex flex-col items-center bg-surface-container-high p-3 text-center shadow-hard-sm">
            <dt className="font-hud text-[11px] font-black uppercase tracking-widest text-on-surface-variant">{tile.label}</dt>
            <dd className="mt-1 font-display text-headline-md italic leading-none text-secondary">{tile.value}</dd>
          </div>
        ))}
      </dl>
      <p className="flex items-center gap-2 text-on-surface-variant">
        <Icon name="analytics" size={22} className="text-primary-container" />
        {dictionary.empty}
      </p>
    </section>
  );
}
