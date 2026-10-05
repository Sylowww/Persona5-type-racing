"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { isCharacterId } from "@/lib/characters";
import { getLobbyStore } from "@/lib/lobby-server";
import { setUserCharacter } from "@/lib/users";

/** Saves the character a registered player races as, and shows it in their current lobby (the race itself keeps the old runner). */
export async function chooseCharacter(form: FormData): Promise<void> {
  const user = await getCurrentUser();
  const character = form.get("character");
  if (user?.kind !== "registered" || !isCharacterId(character) || character === user.character) return;
  await setUserCharacter(user.id, character);
  getLobbyStore().setCharacter(user.id, character);
  refresh();
}
