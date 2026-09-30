/** Letters and digits that are hard to confuse when read aloud or copied (no 0/O, 1/I). */
export const LOBBY_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const LOBBY_CODE_PREFIX = "P5-";
const SUFFIX_LENGTH = 4;

const CODE_PATTERN = new RegExp(`^${LOBBY_CODE_PREFIX}[${LOBBY_CODE_ALPHABET}]{${SUFFIX_LENGTH}}$`);

/** Random integer in [0, max). */
export type RandomInt = (max: number) => number;

export function generateLobbyCode(randomInt: RandomInt): string {
  let suffix = "";
  for (let index = 0; index < SUFFIX_LENGTH; index++) suffix += LOBBY_CODE_ALPHABET[randomInt(LOBBY_CODE_ALPHABET.length)];
  return LOBBY_CODE_PREFIX + suffix;
}

/** A code not already taken; throws if none is found (only possible when almost every code is in use). */
export function generateUniqueLobbyCode(randomInt: RandomInt, isTaken: (code: string) => boolean, maxAttempts = 100): string {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateLobbyCode(randomInt);
    if (!isTaken(code)) return code;
  }
  throw new Error("No free lobby code");
}

/** Accepts `p5-abcd`, `P5-ABCD` or just `ABCD`; returns the canonical code or null when invalid. */
export function normalizeLobbyCode(input: string): string | null {
  const compact = input.trim().toUpperCase().replace(/\s+/g, "");
  const code = compact.length === SUFFIX_LENGTH ? LOBBY_CODE_PREFIX + compact : compact;
  return CODE_PATTERN.test(code) ? code : null;
}
