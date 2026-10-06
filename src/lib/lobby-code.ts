/** Letters and digits that are hard to confuse when read aloud or copied (no 0/O, 1/I/L). */
export const LOBBY_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const LOBBY_CODE_LENGTH = 6;

const CODE_PATTERN = new RegExp(`^[${LOBBY_CODE_ALPHABET}]{${LOBBY_CODE_LENGTH}}$`);

/** Random integer in [0, max). */
export type RandomInt = (max: number) => number;

export function generateLobbyCode(randomInt: RandomInt): string {
  let code = "";
  for (let index = 0; index < LOBBY_CODE_LENGTH; index++) code += LOBBY_CODE_ALPHABET[randomInt(LOBBY_CODE_ALPHABET.length)];
  return code;
}

/** A code not already taken; throws if none is found (only possible when almost every code is in use). */
export function generateUniqueLobbyCode(randomInt: RandomInt, isTaken: (code: string) => boolean, maxAttempts = 100): string {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateLobbyCode(randomInt);
    if (!isTaken(code)) return code;
  }
  throw new Error("No free lobby code");
}

/** Accepts `abcdef`, `ABC DEF` or `ABC-DEF`; returns the canonical code or null when invalid. */
export function normalizeLobbyCode(input: string): string | null {
  const code = input.trim().toUpperCase().replace(/[\s-]+/g, "");
  return CODE_PATTERN.test(code) ? code : null;
}
