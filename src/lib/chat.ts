import { chatMessageSchema } from "./schemas";

export { MAX_MESSAGE_LENGTH } from "./schemas";
/** Messages kept per lobby; older ones are dropped. */
export const MAX_LOBBY_MESSAGES = 50;
/** Minimum time between two messages of the same player. */
export const MESSAGE_COOLDOWN_MS = 500;

/** Trims and collapses whitespace; null when empty, too long or not a string (`chatMessageSchema`). */
export function cleanMessage(value: unknown): string | null {
  const result = chatMessageSchema.safeParse(value);
  return result.success ? result.data : null;
}
