type StatTileProps = {
  label: string;
  value: string;
  note: string;
  valueColor: string;
};

export function StatTile({ label, value, note, valueColor }: StatTileProps) {
  return (
    // Plates stuck on at alternating angles, like the stat screens of Persona 5.
    <div className="flex min-w-0 flex-col gap-1 border-2 border-surface-container-high bg-surface-container-low px-2 py-3 odd:-rotate-2 sm:px-3 even:rotate-1">
      <dt className="w-fit -skew-x-12 bg-surface-container-lowest px-1.5 font-hud text-[11px] font-black uppercase tracking-widest text-secondary">{label}</dt>
      <dd className={`font-display text-headline-md italic leading-none ${valueColor}`}>{value}</dd>
      <dd className="font-hud text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{note}</dd>
    </div>
  );
}
