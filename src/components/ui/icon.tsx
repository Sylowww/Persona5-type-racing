export const iconNames = [
  "radar",
  "psychology",
  "local_fire_department",
  "light_mode",
  "healing",
  "flare",
  "dark_mode",
  "air",
  "ac_unit",
  "add",
  "analytics",
  "arrow_forward",
  "assignment",
  "block",
  "bolt",
  "chat",
  "check",
  "chevron_left",
  "chevron_right",
  "close",
  "content_copy",
  "graphic_eq",
  "home",
  "key",
  "keyboard",
  "keyboard_double_arrow_down",
  "link",
  "lock",
  "login",
  "logout",
  "mail",
  "military_tech",
  "model_training",
  "music_note",
  "pause",
  "person",
  "person_add",
  "pin",
  "play_arrow",
  "remove",
  "refresh",
  "send",
  "smart_toy",
  "speed",
  "sports_martial_arts",
  "star",
  "style",
  "swords",
  "theater_comedy",
  "timer",
  "translate",
  "tune",
  "visibility",
  "visibility_off",
  "volume_off",
  "volume_up",
  "warning",
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
