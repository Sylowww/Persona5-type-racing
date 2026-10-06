import { isLocale } from "../i18n/locales";
import type { RaceMode, RaceSettings } from "@/types/lobby";

export const raceModes: readonly RaceMode[] = ["normal", "suddenDeath"];

/** Time limits the host can pick, in seconds; null means no limit. */
export const timeLimitOptions: readonly (number | null)[] = [30, 60, 120, 180, null];

export const defaultRaceSettings: RaceSettings = {
  mode: "normal",
  powers: false,
  timeLimitSec: 180,
  numbers: false,
  caseSensitive: true,
  // Replaced by the host's interface language when a lobby is created.
  language: "fr",
};

/** Races without a time limit still end after this long, so an idle racer cannot keep a lobby busy forever. */
export const UNTIMED_RACE_CAP_MS = 30 * 60_000;

/** Applies a partial change sent by a client; null when any field is invalid. */
export function parseRaceSettings(current: RaceSettings, value: unknown): RaceSettings | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const next: RaceSettings = { ...current };
  for (const [key, field] of Object.entries(value)) {
    if (key === "mode" && raceModes.some((mode) => mode === field)) next.mode = field as RaceMode;
    else if (key === "timeLimitSec" && timeLimitOptions.includes(field as number | null)) next.timeLimitSec = field as number | null;
    else if (key === "language" && typeof field === "string" && isLocale(field)) next.language = field;
    else if ((key === "powers" || key === "numbers" || key === "caseSensitive") && typeof field === "boolean") next[key] = field;
    else return null;
  }
  return next;
}

/** Race length in ms for these settings. */
export function raceDurationMs(settings: RaceSettings): number {
  return settings.timeLimitSec === null ? UNTIMED_RACE_CAP_MS : settings.timeLimitSec * 1000;
}
