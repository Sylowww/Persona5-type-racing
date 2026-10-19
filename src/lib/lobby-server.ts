import "server-only";
import { randomInt } from "node:crypto";
import { createLobbyStore, type LobbyStore } from "./lobby-store";
import { saveRaceResults } from "./race-history-db";
import type { EngineConfig } from "./race-engine";
import { loadRaceCorpus } from "./race-text-db";
import { builtInCorpus } from "./race-texts";
import type { CorpusText } from "./text-builder";

// One store per Node process. Kept on globalThis so dev hot reloads and separate route bundles share it.
const globalForLobbies = globalThis as typeof globalThis & { lobbyStore?: LobbyStore; raceCorpus?: readonly CorpusText[] };

/** How often the passages are read again from the database, so new ones show up without a restart. */
const CORPUS_REFRESH_MS = 10 * 60_000;

/** Loads the database corpus in the background; races use the built-in passages alone until it is there (or if it fails). */
function refreshCorpus() {
  loadRaceCorpus()
    .then((corpus) => {
      // The built-in passages always count, so a new one works before the seed copies it to the database.
      const known = new Set(corpus.map((text) => text.body));
      globalForLobbies.raceCorpus = [...corpus, ...builtInCorpus.filter((text) => !known.has(text.body))];
    })
    .catch((error: unknown) => console.error("Could not load race texts", error));
}

function configFromEnv(): Partial<EngineConfig> {
  const capacity = Number(process.env.LOBBY_CAPACITY);
  return Number.isFinite(capacity) && capacity > 0 ? { capacity } : {};
}

export function getLobbyStore(): LobbyStore {
  if (!globalForLobbies.lobbyStore) {
    refreshCorpus();
    setInterval(refreshCorpus, CORPUS_REFRESH_MS).unref();
  }
  globalForLobbies.lobbyStore ??= createLobbyStore({
    config: configFromEnv(),
    corpus: () => globalForLobbies.raceCorpus ?? builtInCorpus,
    randomInt: (max) => randomInt(max),
    // Saving runs in the background: a database error must not stop the race timers.
    onRaceFinished: (code, results) => {
      saveRaceResults(code, results).catch((error: unknown) => console.error("Could not save race results", error));
    },
  });
  return globalForLobbies.lobbyStore;
}
