import type { PlayerEmblem as Emblem } from "@/types/lobby";

/** Original placeholder art until players can pick real avatars. */
export function PlayerEmblem({ emblem }: { emblem: Emblem }) {
  switch (emblem) {
    case "domino":
      return (
        <svg viewBox="0 0 100 100" className="size-full">
          <circle cx="50" cy="50" r="40" className="fill-surface-container-high" />
          <path d="M14 42 Q50 30 86 42 Q82 62 62 60 L50 52 L38 60 Q18 62 14 42 Z" className="fill-surface-container-lowest" />
          <circle cx="34" cy="47" r="5" className="fill-secondary" />
          <circle cx="66" cy="47" r="5" className="fill-secondary" />
          <path d="M40 74 Q50 80 60 74" fill="none" strokeWidth="3" className="stroke-primary-container" />
        </svg>
      );
    case "cat":
      return (
        <svg viewBox="0 0 100 100" className="size-full">
          <polygon points="50,5 90,90 10,90" className="fill-primary-container opacity-20" />
          <circle cx="50" cy="45" r="28" className="fill-surface-container-high" />
          <path d="M35 30 L45 15 L50 28 L55 15 L65 30 Z" className="fill-secondary-fixed" />
          <circle cx="42" cy="45" r="4" className="fill-secondary" />
          <circle cx="58" cy="45" r="4" className="fill-secondary" />
          <path d="M44 58 Q50 64 56 58" fill="none" strokeWidth="2" className="stroke-secondary" />
        </svg>
      );
    case "skull":
      return (
        <svg viewBox="0 0 100 100" strokeWidth="3" className="size-full fill-none stroke-error">
          <path d="M25 40 C25 20, 75 20, 75 40 C75 55, 65 65, 65 75 L35 75 C35 65, 25 55, 25 40 Z" />
          <circle cx="40" cy="45" r="7" className="fill-error" />
          <circle cx="60" cy="45" r="7" className="fill-error" />
          <path d="M45 62 H55 M42 75 V85 M50 75 V85 M58 75 V85" />
        </svg>
      );
    case "mask":
      return (
        <svg viewBox="0 0 100 100" className="size-full">
          <path d="M10 35 Q50 65 90 35 Q85 70 50 85 Q15 70 10 35 Z" className="fill-primary-container" />
          <circle cx="35" cy="48" r="8" className="fill-surface-container-lowest" />
          <circle cx="65" cy="48" r="8" className="fill-surface-container-lowest" />
        </svg>
      );
  }
}
