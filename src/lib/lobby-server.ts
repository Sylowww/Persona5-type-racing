import "server-only";
import { randomInt } from "node:crypto";
import { statSync } from "node:fs";
import path from "node:path";
import { clearLobbySeats, recordLobbySeat, releaseLobbySeat } from "./lobby-members-db";
import { createLobbyStore, type LobbyStore } from "./lobby-store";
import { saveRaceResults } from "./race-history-db";
import type { EngineConfig } from "./race-engine";
import { loadRaceCorpus } from "./race-text-db";
import { builtInCorpus } from "./race-texts";
import type { CorpusText } from "./text-builder";

// One store per Node process. Kept on globalThis so dev hot reloads and separate route bundles share it.
const globalForLobbies = globalThis as typeof globalThis & {
  lobbyStore?: LobbyStore;
  lobbyCode?: string;
  raceCorpus?: readonly CorpusText[];
  corpusTimer?: ReturnType<typeof setInterval>;
};

/** Files holding the race rules the store runs. */
const RULE_FILES = ["lobby-store", "race-engine", "bonuses", "bots", "spells", "typing", "text-builder", "race-settings", "lobby"];

/**
 * Development only: when the race rules were last edited. A hot reload replaces their modules but not the store kept
 * on globalThis, which would keep running the old rules; when a rule file changes, the store is made again (lobbies in
 * progress are dropped). File times rather than module identity, because separate route bundles each load their own
 * copy of the same modules.
 */
function rulesVersion(): string {
  return RULE_FILES.map((file) => {
    try {
      return statSync(path.join(process.cwd(), "src", "lib", `${file}.ts`)).mtimeMs;
    } catch {
      return 0;
    }
  }).join(":");
}

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
  const code = process.env.NODE_ENV === "production" ? null : rulesVersion();
  if (code !== null && globalForLobbies.lobbyStore && globalForLobbies.lobbyCode !== code) {
    console.info("Race rules changed: starting a fresh lobby store.");
    globalForLobbies.lobbyStore.dispose();
    globalForLobbies.lobbyStore = undefined;
  }
  if (!globalForLobbies.lobbyStore) {
    if (code !== null) globalForLobbies.lobbyCode = code;
    // Seats recorded by a previous process (or store) belong to lobbies that no longer exist.
    clearLobbySeats().catch((error: unknown) => console.error("Could not clear lobby seats", error));
    refreshCorpus();
    globalForLobbies.corpusTimer ??= setInterval(refreshCorpus, CORPUS_REFRESH_MS);
    globalForLobbies.corpusTimer.unref?.();
  }
  globalForLobbies.lobbyStore ??= createLobbyStore({
    config: configFromEnv(),
    corpus: () => globalForLobbies.raceCorpus ?? builtInCorpus,
    randomInt: (max) => randomInt(max),
    // Keeps the lobby_members table (SALLE-06) in step with every move the store makes.
    onMembership: (userId, code, previous) => {
      const write = code ? recordLobbySeat(userId, code) : previous ? releaseLobbySeat(userId, previous) : Promise.resolve();
      write.catch((error: unknown) => console.error("Could not record a lobby seat", error));
    },
    // Saving runs in the background: a database error must not stop the race timers.
    onRaceFinished: (code, results) => {
      saveRaceResults(code, results).catch((error: unknown) => console.error("Could not save race results", error));
    },
  });
  return globalForLobbies.lobbyStore;
}
