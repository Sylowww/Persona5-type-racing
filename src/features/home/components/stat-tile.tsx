type StatTileProps = {
  label: string;
  value: string;
  note: string;
  valueColor: string;
};

export function StatTile({ label, value, note, valueColor }: StatTileProps) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 first:pl-0">
      <dt className="font-hud text-[11px] font-black uppercase tracking-widest text-on-surface-variant">{label}</dt>
      <dd className={`font-display text-headline-md italic leading-none ${valueColor}`}>{value}</dd>
      <dd className="font-hud text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{note}</dd>
    </div>
  );
}
