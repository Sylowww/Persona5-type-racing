import { Icon, type IconName } from "@/components/ui/icon";
import { Tilt } from "@/components/ui/tilt";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { formatMessage } from "@/i18n/format";
import { BIG_HEIST_RACERS, LIGHTNING_BOT_WPM, type AchievementId, type AchievementState } from "@/lib/achievements";

const icons: Record<AchievementId, IconName> = {
  perfect: "flare",
  century: "speed",
  duelist: "swords",
  bigHeist: "military_tech",
  lightning: "bolt",
  marathon: "timer",
  allMasks: "theater_comedy",
  unbreakable: "star",
};

type AchievementCardProps = {
  dictionary: Dictionary["compendium"];
  state: AchievementState;
  /** Card angle on the table. */
  className?: string;
};

/**
 * One achievement card: the feat's emblem on a red halftone panel once earned (with a foil glare under the mouse),
 * a dim locked card with its hint and progress until then.
 */
export function AchievementCard({ dictionary, state, className = "" }: AchievementCardProps) {
  const { id, unlocked, current, target } = state;
  const { name, hint } = dictionary.achievements[id];
  const label = formatMessage(dictionary.achievementCard, {
    name,
    state: unlocked ? dictionary.unlocked : formatMessage(dictionary.locked, { current, target }),
  });

  return (
    <li className="flex w-[150px] flex-col items-center gap-3">
      <Tilt glare={unlocked ? "holo" : "none"} max={12} className={className}>
        <div
          role="img"
          aria-label={label}
          className={`flex w-[150px] flex-col gap-2 border-2 p-2 shadow-hard-lg ${
            unlocked ? "border-secondary-fixed bg-surface-container-lowest shadow-primary-container" : "border-outline bg-surface-container-low shadow-surface-container-lowest"
          }`}
        >
          <span className={`text-center font-hud text-label-hud font-black uppercase tracking-widest ${unlocked ? "text-secondary-fixed" : "text-on-surface-variant"}`}>
            {dictionary.achievementLabel}
          </span>
          <span
            className={`relative flex aspect-[3/4] w-full items-center justify-center border ${
              unlocked ? "halftone border-secondary-fixed bg-primary-container text-secondary" : "border-outline bg-surface-container-lowest text-outline"
            }`}
          >
            <Icon name={icons[id]} size={64} filled={unlocked} className={unlocked ? "drop-shadow-[4px_4px_0_var(--color-surface-container-lowest)]" : ""} />
            {!unlocked && <Icon name="lock" size={22} className="absolute right-2 bottom-2 text-on-surface-variant" />}
          </span>
          <span className={`text-center font-display text-[17px] uppercase leading-tight tracking-wider ${unlocked ? "text-secondary-fixed" : "text-on-surface-variant"}`}>
            {name}
          </span>
          <span aria-hidden="true" className="h-1.5 w-full -skew-x-12 bg-surface-container-high">
            <span className={`block h-full ${unlocked ? "bg-secondary-fixed" : "bg-primary-container"}`} style={{ width: `${(current / target) * 100}%` }} />
          </span>
        </div>
      </Tilt>
      <span className="text-center text-[13px] leading-snug text-on-surface-variant">
        {formatMessage(hint, { count: BIG_HEIST_RACERS, wpm: LIGHTNING_BOT_WPM })}
      </span>
    </li>
  );
}
