import { Icon, type IconName } from "@/components/ui/icon";

type SectionTagProps = {
  id: string;
  icon: IconName;
  title: string;
  badge: string;
  tilt?: "left" | "right";
};

/** Tilted header strip on top of each results column. */
export function SectionTag({ id, icon, title, badge, tilt = "left" }: SectionTagProps) {
  return (
    <div
      className={`flex items-center justify-between gap-2 bg-surface-container-high px-4 py-2 shadow-hard-sm ${
        tilt === "left" ? "-rotate-1" : "rotate-1"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon name={icon} size={22} className="text-secondary-fixed" filled />
        <h2 id={id} className="font-hud text-headline-sm font-black uppercase italic text-on-surface">
          {title}
        </h2>
      </div>
      <span className="whitespace-nowrap bg-primary-container px-2 py-0.5 font-hud text-label-hud font-black uppercase text-on-primary-container">
        {badge}
      </span>
    </div>
  );
}
