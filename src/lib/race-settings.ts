import { isLocale } from "../i18n/locales";
import type { RaceMode, RaceSettings, TextComplexity, TextType } from "@/types/lobby";

export const raceModes: readonly RaceMode[] = ["normal", "blocking", "free", "suddenDeath"];

/** Time limits the host can pick, in seconds (30 s to 10 min, CONF-01); null means no limit. */
export const timeLimitOptions: readonly (number | null)[] = [30, 60, 120, 180, 300, 600, null];

export const textTypes: readonly TextType[] = ["coherent", "random"];
export const textComplexities: readonly TextComplexity[] = ["easy", "medium", "hard"];
/** Text lengths the host can pick, in words (CONF-04). */
export const wordCountOptions: readonly number[] = [15, 30, 50, 100];
/** Letters a host may list in the include / exclude fields. */
export const MAX_CHAR_FILTER = 12;

export const defaultRaceSettings: RaceSettings = {
  mode: "normal",
  powers: false,
  timeLimitSec: 180,
  numbers: false,
  caseSensitive: true,
  // Replaced by the host's interface language when a lobby is created.
  language: "fr",
  textType: "coherent",
  wordCount: 30,
  complexity: "medium",
  punctuation: true,
  capitals: true,
  accents: true,
  includeChars: "",
  excludeChars: "",
};

/** Races without a time limit still end after this long, so an idle racer cannot keep a lobby busy forever. */
export const UNTIMED_RACE_CAP_MS = 30 * 60_000;

const booleanFields = ["powers", "numbers", "caseSensitive", "punctuation", "capitals", "accents"] as const;

/** Distinct lowercase letters of a filter field; null when it holds anything else or too many letters. */
export function parseCharFilter(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const letters = [...new Set([...value.toLowerCase()].filter((char) => char.trim() !== ""))];
  if (letters.length > MAX_CHAR_FILTER || letters.some((char) => !/^\p{L}$/u.test(char))) return null;
  return letters.join("");
}

/** Applies a partial change sent by a client; null when any field is invalid. */
export function parseRaceSettings(current: RaceSettings, value: unknown): RaceSettings | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const next: RaceSettings = { ...current };
  for (const [key, field] of Object.entries(value)) {
    const mode = raceModes.find((option) => option === field);
    const textType = textTypes.find((option) => option === field);
    const complexity = textComplexities.find((option) => option === field);
    const filter = parseCharFilter(field);
    if (key === "mode" && mode) next.mode = mode;
    else if (key === "timeLimitSec" && timeLimitOptions.includes(field as number | null)) next.timeLimitSec = field as number | null;
    else if (key === "language" && typeof field === "string" && isLocale(field)) next.language = field;
    else if (key === "textType" && textType) next.textType = textType;
    else if (key === "complexity" && complexity) next.complexity = complexity;
    else if (key === "wordCount" && wordCountOptions.includes(field as number)) next.wordCount = field as number;
    else if ((key === "includeChars" || key === "excludeChars") && filter !== null) next[key] = filter;
    else if (booleanFields.some((name) => name === key) && typeof field === "boolean") next[key as (typeof booleanFields)[number]] = field;
    else return null;
  }
  return next;
}

/** Race length in ms for these settings. */
export function raceDurationMs(settings: RaceSettings): number {
  return settings.timeLimitSec === null ? UNTIMED_RACE_CAP_MS : settings.timeLimitSec * 1000;
}
