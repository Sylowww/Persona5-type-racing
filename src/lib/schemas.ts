// Zod schemas for every input the server receives (TECH-07): Server Functions, route handlers and the keystroke
// batches of the real-time channel. Parsers elsewhere in `lib/` wrap these and keep their own error codes.
import { z } from "zod";
import { locales } from "../i18n/locales";
import { botDifficulties } from "./bots";
import { characterIds } from "./characters";
import { lobbyVisibilities } from "./lobby";
import { normalizeLobbyCode } from "./lobby-code";
import { oauthProviders } from "../types/user";

export const localeSchema = z.enum(locales);

/** A lobby code as typed (`abcdef`, `ABC DEF`, `ABC-DEF`), turned into its canonical form. */
export const lobbyCodeSchema = z
  .string()
  .max(16)
  .transform((value, context) => {
    const code = normalizeLobbyCode(value);
    if (code === null) {
      context.addIssue({ code: "custom", message: "invalidCode" });
      return z.NEVER;
    }
    return code;
  });

export const botDifficultySchema = z.enum(botDifficulties);
export const characterSchema = z.enum(characterIds);
export const visibilitySchema = z.enum(lobbyVisibilities);
export const memberRoleSchema = z.enum(["player", "spectator"]);
/** Bot ids and player ids sent back by the client. */
export const memberIdSchema = z.string().min(1).max(64);
/** Invite link tokens: 128 random bits in base64url (22 characters), with some room. */
export const inviteTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{16,64}$/);
export const uuidSchema = z.uuid();
export const oauthProviderSchema = z.enum(oauthProviders);

/** The OAuth flow kept in a cookie between the redirect to the provider and its callback. */
export const oauthFlowSchema = z.object({
  provider: z.string(),
  state: z.string(),
  verifier: z.string(),
  locale: localeSchema.catch("fr"),
});

/** One keystroke event of a batch; a character is a single code point. */
const inputEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("delete") }).strip(),
  z
    .object({
      type: z.literal("char"),
      char: z.string().refine((value) => [...value].length === 1),
      delayMs: z.number().finite(),
    })
    .strip(),
]);

/** A batch of keystrokes sent during a race (the real-time messages from client to server). */
export const inputBatchSchema = z.object({
  clientId: z.string().min(1).max(64),
  seq: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  events: z.array(inputEventSchema).max(200),
});

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

/** Usernames and guest nicknames; the error message is the code the UI translates. */
export const usernameSchema = z
  .string()
  .trim()
  .min(USERNAME_MIN, { message: "usernameLength" })
  .max(USERNAME_MAX, { message: "usernameLength" })
  .regex(/^[A-Za-z0-9_-]+$/, { message: "usernameChars" });

export const emailSchema = z.string().trim().max(254, { message: "emailInvalid" }).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "emailInvalid" });

export const passwordSchema = z.string().min(PASSWORD_MIN, { message: "passwordLength" }).max(PASSWORD_MAX, { message: "passwordLength" });

/** Longest chat message, in characters. */
export const MAX_MESSAGE_LENGTH = 140;

/** A chat message: whitespace collapsed, control characters removed, 1 to `MAX_MESSAGE_LENGTH` characters. */
export const chatMessageSchema = z
  .string()
  .transform((value) => value.replace(/\s+/g, " ").replace(/\p{Cc}/gu, "").trim())
  .refine((text) => text.length > 0 && [...text].length <= MAX_MESSAGE_LENGTH);
