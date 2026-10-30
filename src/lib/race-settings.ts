import { z } from "zod";
import { locales } from "../i18n/locales";
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

/** Distinct lowercase letters, at most `MAX_CHAR_FILTER` of them. */
const charFilterSchema = z
  .string()
  .transform((value) => [...new Set([...value.toLowerCase()].filter((char) => char.trim() !== ""))])
  .refine((letters) => letters.length <= MAX_CHAR_FILTER && letters.every((char) => /^\p{L}$/u.test(char)))
  .transform((letters) => letters.join(""));

/** A change the host sends from the settings panel: any subset of the fields, nothing else (TECH-07). */
const settingsChangeSchema = z
  .object({
    mode: z.enum(raceModes),
    timeLimitSec: z.union(timeLimitOptions.map((option) => z.literal(option)) as [z.ZodLiteral<number | null>, ...z.ZodLiteral<number | null>[]]),
    language: z.enum(locales),
    textType: z.enum(textTypes),
    wordCount: z.union(wordCountOptions.map((option) => z.literal(option)) as [z.ZodLiteral<number>, ...z.ZodLiteral<number>[]]),
    complexity: z.enum(textComplexities),
    powers: z.boolean(),
    numbers: z.boolean(),
    caseSensitive: z.boolean(),
    punctuation: z.boolean(),
    capitals: z.boolean(),
    accents: z.boolean(),
    includeChars: charFilterSchema,
    excludeChars: charFilterSchema,
  })
  .partial()
  .strict();

/** Distinct lowercase letters of a filter field; null when it holds anything else or too many letters. */
export function parseCharFilter(value: unknown): string | null {
  const result = charFilterSchema.safeParse(value);
  return result.success ? result.data : null;
}

/** Applies a partial change sent by a client; null when any field is invalid. */
export function parseRaceSettings(current: RaceSettings, value: unknown): RaceSettings | null {
  const result = settingsChangeSchema.safeParse(value);
  if (!result.success) return null;
  // `{ mode: undefined }` passes an optional field: keep the current value rather than erase it.
  const change = Object.fromEntries(Object.entries(result.data).filter(([, field]) => field !== undefined));
  return { ...current, ...change };
}

/** Race length in ms for these settings. */
export function raceDurationMs(settings: RaceSettings): number {
  return settings.timeLimitSec === null ? UNTIMED_RACE_CAP_MS : settings.timeLimitSec * 1000;
}
