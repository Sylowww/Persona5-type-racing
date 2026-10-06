"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { validateUsername, type ValidationError } from "@/lib/auth/validation";
import { MAX_AVATAR_BYTES, validateAvatar, type AvatarError } from "@/lib/avatar";
import { isCharacterId } from "@/lib/characters";
import { getLobbyStore } from "@/lib/lobby-server";
import { renameUser, saveUserAvatar, setUserCharacter } from "@/lib/users";

export type ProfileError = Extract<ValidationError, "usernameLength" | "usernameChars"> | AvatarError | "required" | "usernameTaken" | "unexpected";

export type ProfileFormState = { error: ProfileError | null; saved: boolean };

/** Saves the character a registered player races as, and shows it in their current lobby (the race itself keeps the old runner). */
export async function chooseCharacter(form: FormData): Promise<void> {
  const user = await getCurrentUser();
  const character = form.get("character");
  if (user?.kind !== "registered" || !isCharacterId(character) || character === user.character) return;
  await setUserCharacter(user.id, character);
  getLobbyStore().setCharacter(user.id, character);
  refresh();
}

/** Changes a registered player's display name, and shows it in their current lobby (the race in progress keeps the old one). */
export async function changeUsername(_previous: ProfileFormState, form: FormData): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (user?.kind !== "registered") return { error: "unexpected", saved: false };

  const value = form.get("username");
  const username = typeof value === "string" ? value.trim() : "";
  const invalid = username ? validateUsername(username) : "required";
  if (invalid) return { error: invalid, saved: false };
  if (username === user.username) return { error: null, saved: true };

  const result = await renameUser(user.id, username);
  if (!result.ok) return { error: result.error, saved: false };
  getLobbyStore().setName(user.id, username);
  refresh();
  return { error: null, saved: true };
}

/** Saves a profile picture after checking its real type (from its bytes) and size on the server. */
export async function uploadAvatar(_previous: ProfileFormState, form: FormData): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (user?.kind !== "registered") return { error: "unexpected", saved: false };

  const file = form.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { error: "missing", saved: false };
  // Checked before reading, so an oversized file is never loaded into memory.
  if (file.size > MAX_AVATAR_BYTES) return { error: "tooLarge", saved: false };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const avatar = validateAvatar(bytes);
  if (!avatar.ok) return { error: avatar.error, saved: false };

  await saveUserAvatar(user.id, avatar.type, bytes);
  refresh();
  return { error: null, saved: true };
}
