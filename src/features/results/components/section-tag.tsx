import { Icon, type IconName } from "@/components/ui/icon";

type SectionTagProps = {
  id: string;
  icon: IconName;
  title: string;
  badge: string;
};

/** Header line on top of each results section. */
export function SectionTag({ id, icon, title, badge }: SectionTagProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-surface-container-high pb-3">
      <div className="flex items-center gap-2">
        <Icon name={icon} size={20} className="text-primary-container" filled />
        <h2 id={id} className="font-hud text-label-hud font-black uppercase tracking-widest text-secondary">
          {title}
        </h2>
      </div>
      <span className="whitespace-nowrap font-hud text-[11px] font-black uppercase tracking-widest text-on-surface-variant">{badge}</span>
    </div>
  );
}
