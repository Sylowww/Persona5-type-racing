"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { isCharacterId } from "@/lib/characters";
import { setUserCharacter } from "@/lib/users";

/** Saves the character a registered player races as; it applies from the next lobby they join. */
export async function chooseCharacter(form: FormData): Promise<void> {
  const user = await getCurrentUser();
  const character = form.get("character");
  if (user?.kind !== "registered" || !isCharacterId(character) || character === user.character) return;
  await setUserCharacter(user.id, character);
  refresh();
}
