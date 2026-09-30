export const iconNames = [
  "add_circle",
  "arrow_forward",
  "assignment",
  "bolt",
  "chat",
  "check",
  "close",
  "content_copy",
  "electric_bolt",
  "graphic_eq",
  "keyboard",
  "military_tech",
  "model_training",
  "north_east",
  "person",
  "person_add",
  "pin",
  "play_arrow",
  "push_pin",
  "smart_toy",
  "sports_martial_arts",
  "star",
  "swords",
  "theater_comedy",
  "tune",
  "visibility",
  "volume_up",
] as const;

export type IconName = (typeof iconNames)[number];

type IconProps = {
  name: IconName;
  /** In pixels; set inline because the icon font's own stylesheet overrides Tailwind text sizes. */
  size?: number;
  className?: string;
  filled?: boolean;
};

/** Decorative Material Symbols icon; label the surrounding control instead. */
export function Icon({ name, size = 24, className = "", filled = false }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined select-none ${className}`}
      style={{ fontSize: size, fontVariationSettings: filled ? "'FILL' 1" : undefined }}
    >
      {name}
    </span>
  );
}
