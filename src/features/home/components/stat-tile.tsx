type StatTileProps = {
  label: string;
  value: string;
  note: string;
  valueColor: string;
  noteColor: string;
};

export function StatTile({ label, value, note, valueColor, noteColor }: StatTileProps) {
  return (
    <div className="flex flex-col items-center bg-surface-container-high p-2 text-center shadow-hard-sm">
      <dt className="font-hud text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{label}</dt>
      <dd className={`mt-1 font-display text-headline-md italic leading-none ${valueColor}`}>{value}</dd>
      <dd className={`mt-1 font-hud text-[10px] font-bold uppercase ${noteColor}`}>{note}</dd>
    </div>
  );
}
