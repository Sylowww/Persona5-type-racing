import { Icon, type IconName } from "@/components/ui/icon";

export type ModeCardVariant = "blitz" | "lobby" | "training";

type ModeCardProps = {
  variant: ModeCardVariant;
  badge: string;
  title: string;
  description: string;
  meta: string;
  action: string;
};

type VariantStyle = {
  icon: IconName;
  actionIcon: IconName;
  shadowTilt: string;
  card: string;
  badge: string;
  iconColor: string;
  metaColor: string;
  actionHover: string;
};

const variants: Record<ModeCardVariant, VariantStyle> = {
  blitz: {
    icon: "swords",
    actionIcon: "arrow_forward",
    shadowTilt: "rotate-[1deg]",
    card: "rotate-[-1deg] bg-surface-container-low shadow-primary-container",
    badge: "rotate-[-3deg] bg-primary-container text-on-primary-container shadow-hard-xs",
    iconColor: "text-primary-container",
    metaColor: "text-secondary-fixed",
    actionHover: "group-hover:text-primary",
  },
  lobby: {
    icon: "theater_comedy",
    actionIcon: "add_circle",
    shadowTilt: "rotate-[-1.5deg]",
    card: "rotate-[1.5deg] bg-surface-container shadow-secondary-fixed",
    badge: "rotate-[2deg] bg-secondary-container text-on-secondary-fixed shadow-hard-xs",
    iconColor: "text-secondary-fixed",
    metaColor: "text-on-surface",
    actionHover: "group-hover:text-secondary-fixed",
  },
  training: {
    icon: "model_training",
    actionIcon: "north_east",
    shadowTilt: "rotate-[-2deg]",
    card: "rotate-[1deg] bg-surface-container-low shadow-primary-fixed",
    badge: "bg-surface-variant text-secondary",
    iconColor: "text-on-surface-variant",
    metaColor: "text-tertiary-fixed",
    actionHover: "group-hover:text-primary-container",
  },
};

// Not interactive yet: these modes have no pages to link to.
export function ModeCard({ variant, badge, title, description, meta, action }: ModeCardProps) {
  const style = variants[variant];

  return (
    <article className="group relative">
      <div className={`absolute -inset-0.5 translate-x-2 translate-y-2 bg-surface-container-lowest ${style.shadowTilt}`} />
      <div className={`relative flex h-full flex-col p-4 shadow-hard-md transition-transform hover:-translate-y-1 ${style.card}`}>
        <div className="flex items-start justify-between">
          <span className={`px-2 py-0.5 font-hud text-label-hud font-black uppercase ${style.badge}`}>{badge}</span>
          <Icon name={style.icon} size={24} className={style.iconColor} />
        </div>
        <div className="mt-4 flex flex-col gap-1">
          <h2 className="font-display text-headline-md uppercase italic tracking-wide text-secondary">{title}</h2>
          <p className="line-clamp-2 text-body-md text-on-surface-variant">{description}</p>
        </div>
        <div className="mt-auto flex items-center justify-between bg-surface-container-lowest p-1 pt-4">
          <span className={`font-hud text-label-hud font-black uppercase tracking-widest ${style.metaColor}`}>{meta}</span>
          <span className={`flex items-center gap-1 font-hud text-label-hud font-bold uppercase text-secondary transition-colors ${style.actionHover}`}>
            {action}
            <Icon name={style.actionIcon} size={16} />
          </span>
        </div>
      </div>
    </article>
  );
}
