export const homeThemes = ["home-1", "home-2"] as const;

export type HomeTheme = (typeof homeThemes)[number];

export const defaultHomeTheme: HomeTheme = "home-1";

export function isHomeTheme(value: unknown): value is HomeTheme {
  return typeof value === "string" && (homeThemes as readonly string[]).includes(value);
}

/** Where the race theme starts, in seconds: past the intro, so the vocals land as the 3 s countdown ends. */
export const raceThemeStartSeconds = 25;

/**
 * The race page plays the race theme; every other page plays the chosen home theme.
 * The `#t=` media fragment makes the browser start the race theme at `raceThemeStartSeconds`.
 */
export function musicSourceFor(pathname: string, homeTheme: HomeTheme): string {
  const isRace = /^\/[^/]+\/lobby\/[^/]+\/race\/?$/.test(pathname);
  return isRace ? `/music/race.mp3#t=${raceThemeStartSeconds}` : `/music/${homeTheme}.mp3`;
}
