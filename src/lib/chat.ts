/** Longest chat message, in characters. */
export const MAX_MESSAGE_LENGTH = 140;
/** Messages kept per lobby; older ones are dropped. */
export const MAX_LOBBY_MESSAGES = 50;
/** Minimum time between two messages of the same player. */
export const MESSAGE_COOLDOWN_MS = 500;

/** Trims and collapses whitespace; null when empty, too long or not a string. */
export function cleanMessage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").replace(/\p{Cc}/gu, "").trim();
  if (text.length === 0 || [...text].length > MAX_MESSAGE_LENGTH) return null;
  return text;
}
