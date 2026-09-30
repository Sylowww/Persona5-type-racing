import "server-only";
import { randomInt } from "node:crypto";
import { createLobbyStore, type LobbyStore } from "./lobby-store";
import type { EngineConfig } from "./race-engine";

// One store per Node process. Kept on globalThis so dev hot reloads and separate route bundles share it.
const globalForLobbies = globalThis as typeof globalThis & { lobbyStore?: LobbyStore };

function configFromEnv(): Partial<EngineConfig> {
  const capacity = Number(process.env.LOBBY_CAPACITY);
  return Number.isFinite(capacity) && capacity > 0 ? { capacity } : {};
}

export function getLobbyStore(): LobbyStore {
  globalForLobbies.lobbyStore ??= createLobbyStore({ config: configFromEnv(), randomInt: (max) => randomInt(max) });
  return globalForLobbies.lobbyStore;
}
