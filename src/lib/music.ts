export const homeThemes = ["home-1", "home-2"] as const;

export type HomeTheme = (typeof homeThemes)[number];

export const defaultHomeTheme: HomeTheme = "home-1";

export function isHomeTheme(value: unknown): value is HomeTheme {
  return typeof value === "string" && (homeThemes as readonly string[]).includes(value);
}

/** The race page plays the race theme; every other page plays the chosen home theme. */
export function musicSourceFor(pathname: string, homeTheme: HomeTheme): string {
  const isRace = /^\/[^/]+\/lobby\/[^/]+\/race\/?$/.test(pathname);
  return `/music/${isRace ? "race" : homeTheme}.mp3`;
}
