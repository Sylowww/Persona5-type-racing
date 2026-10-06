// In-memory home of every lobby: applies engine rules, runs timers and notifies subscribers.
// State lives in this process only, so the app must run as a single Node instance (see docs/ARCHITECTURE.md).
import type { Locale } from "@/i18n/locales";
import type { CharacterId } from "@/types/character";
import type { BotDifficulty, LobbyView, PublicLobby } from "@/types/lobby";
import type { InputBatch, RaceResult } from "@/types/race";
import { generateUniqueLobbyCode, type RandomInt } from "./lobby-code";
import { QUICK_MATCH_BOT_DELAY_MS, QUICK_MATCH_INTRO_MS, QUICK_MATCH_STALE_MS, quickMatchSettings } from "./matchmaking";
import {
  addBot,
  admitPlayer,
  advance,
  applyInput,
  createLobby,
  isMember,
  joinLobby,
  leaveLobby,
  publicLobbyFor,
  removeBot,
  resultFor,
  sendMessage,
  setCharacter,
  setConnected,
  setReady,
  setVisibility,
  startRace,
  updateSettings,
  viewFor,
  type EngineConfig,
  type LobbyError,
  type LobbyState,
  type Outcome,
  type Player,
} from "./race-engine";
import { pickRaceText } from "./race-texts";

/** Receives a fresh view on every change, or null once the user is no longer in the lobby. */
export type LobbySubscriber = (view: LobbyView | null) => void;

export type StoreError = LobbyError | "lobbyNotFound";

/** A racer of a quick 1v1, shown on the versus screen. */
export type QuickMatchRacer = { id: string; name: string; character: CharacterId; bot: BotDifficulty | null };

/** Where a player stands in quick 1v1 matchmaking. Once matched, `racers` lists the viewer first. */
export type QuickMatchStatus =
  | { state: "idle" }
  | { state: "searching"; waitedMs: number }
  | { state: "matched"; code: string; racers: QuickMatchRacer[] };

type QueueEntry = { player: Player; locale: Locale; bot: BotDifficulty; joinedAt: number; seenAt: number };

export type LobbyStoreOptions = {
  config?: Partial<EngineConfig>;
  now?: () => number;
  randomInt?: RandomInt;
  /** Drives bot behavior; defaults to Math.random. */
  random?: () => number;
  /** How often timers run and typing progress is broadcast; null disables the timer (tests call `tick`). */
  tickMs?: number | null;
  /** Called once per finished race with each player's results (bots excluded), e.g. to save them. */
  onRaceFinished?: (code: string, results: RaceResult[]) => void;
};

export type LobbyStore = ReturnType<typeof createLobbyStore>;

export function createLobbyStore(options: LobbyStoreOptions = {}) {
  const now = options.now ?? Date.now;
  const randomInt = options.randomInt ?? ((max: number) => Math.floor(Math.random() * max));
  const random = options.random ?? Math.random;
  const tickMs = options.tickMs === undefined ? 100 : options.tickMs;

  const lobbies = new Map<string, LobbyState>();
  const lobbyOfUser = new Map<string, string>();
  const subscribers = new Map<string, Set<{ userId: string; send: LobbySubscriber }>>();
  const connections = new Map<string, number>();
  /** Players searching for a quick 1v1, in arrival order. */
  const queue = new Map<string, QueueEntry>();
  /** Quick lobby found for a searching player, until they check their status or leave. */
  const matches = new Map<string, string>();
  /** Lobbies with typing progress not yet broadcast; flushed on the next tick. */
  const pending = new Set<string>();
  let timer: ReturnType<typeof setInterval> | null = null;

  function broadcast(code: string) {
    pending.delete(code);
    const state = lobbies.get(code);
    const time = now();
    for (const subscriber of [...(subscribers.get(code) ?? [])]) {
      subscriber.send(state ? viewFor(state, subscriber.userId, time) : null);
    }
  }

  function commit(code: string, next: LobbyState, immediate = true) {
    const previous = lobbies.get(code);
    if (next === previous) return;

    for (const member of previous?.members ?? []) {
      if (!isMember(next, member.id) && lobbyOfUser.get(member.id) === code) lobbyOfUser.delete(member.id);
    }
    if (next.members.length === 0) {
      lobbies.delete(code);
    } else {
      lobbies.set(code, next);
      for (const member of next.members) if (member.bot === null && isMember(next, member.id)) lobbyOfUser.set(member.id, code);
    }

    if (immediate) broadcast(code);
    else pending.add(code);
    syncTimer();
    if (previous?.phase !== "finished" && next.phase === "finished") reportFinish(code, next);
  }

  function reportFinish(code: string, state: LobbyState) {
    // Training races are practice only and never saved.
    if (!options.onRaceFinished || state.kind === "training") return;
    const results = (state.race?.racers ?? [])
      .filter((racer) => racer.bot === null)
      .flatMap((racer) => resultFor(state, racer.id) ?? []);
    options.onRaceFinished(code, results);
  }

  /** Runs one engine step between two time-based advances. */
  function update(code: string, step: (state: LobbyState, time: number) => LobbyState, immediate = true) {
    const state = lobbies.get(code);
    if (!state) return;
    const time = now();
    commit(code, advance(step(advance(state, time), time), time), immediate);
  }

  function updateOutcome(code: string, step: (state: LobbyState, time: number) => Outcome): StoreError | null {
    if (!lobbies.has(code)) return "lobbyNotFound";
    let error: LobbyError | null = null;
    update(code, (state, time) => {
      const outcome = step(state, time);
      if (outcome.ok) return outcome.state;
      error = outcome.error;
      return state;
    });
    return error;
  }

  function syncTimer() {
    if (tickMs === null) return;
    if (lobbies.size > 0 && !timer) {
      timer = setInterval(tick, tickMs);
      timer.unref?.();
    } else if (lobbies.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  /** Countdown end, bot keystrokes, race end, expired seats, and throttled progress broadcasts. */
  function tick() {
    const time = now();
    for (const [code, state] of [...lobbies]) {
      const next = advance(state, time);
      if (next !== state) commit(code, next);
      else if (pending.has(code)) broadcast(code);
    }
  }

  /** A player is in one lobby at a time: joining another leaves the previous one. */
  function leaveOtherLobby(userId: string, code?: string) {
    const current = lobbyOfUser.get(userId);
    if (current && current !== code) update(current, (state) => leaveLobby(state, userId));
  }

  /** Opens a lobby of `kind` for these players (plus a bot if given) and starts its race at once. */
  function startPrivateRace(kind: "quick" | "training", players: readonly Player[], locale: Locale, bot: BotDifficulty | null): string {
    for (const player of players) leaveOtherLobby(player.id);
    const time = now();
    const [host, ...others] = players;
    const code = generateUniqueLobbyCode(randomInt, (candidate) => lobbies.has(candidate));
    const settings = kind === "quick" ? quickMatchSettings : undefined;
    let state = createLobby({ code, locale, host, now: time, config: options.config, kind, settings });
    for (const player of others) state = must(admitPlayer(state, player, time));
    if (bot) state = must(addBot(state, host.id, bot, random));
    for (const player of players) state = must(setReady(state, player.id, true));
    // Quick races leave time for the versus screen before their countdown.
    const startAt = kind === "quick" ? time + QUICK_MATCH_INTRO_MS : time;
    state = must(startRace(state, host.id, pickRaceText(state.settings.language, randomInt, state.settings.numbers), startAt, random));
    commit(code, state);
    return code;
  }

  function dropStaleSearches(time: number) {
    for (const [userId, entry] of queue) if (time - entry.seenAt > QUICK_MATCH_STALE_MS) queue.delete(userId);
  }

  function matchedStatus(userId: string): QuickMatchStatus | null {
    const code = matches.get(userId);
    if (!code) return null;
    const state = lobbies.get(code);
    if (!state) {
      matches.delete(userId);
      return null;
    }
    const racers = state.members
      .filter((member) => member.presence !== "left")
      .map(({ id, name, character, bot }) => ({ id, name, character, bot }))
      .sort((a, b) => Number(b.id === userId) - Number(a.id === userId));
    return { state: "matched", code, racers };
  }

  function startQuickMatch(userId: string, entries: readonly QueueEntry[], bot: BotDifficulty | null): QuickMatchStatus {
    for (const entry of entries) queue.delete(entry.player.id);
    const code = startPrivateRace("quick", entries.map((entry) => entry.player), entries[0].locale, bot);
    for (const entry of entries) matches.set(entry.player.id, code);
    return matchedStatus(userId) ?? { state: "idle" };
  }

  return {
    create(host: Player, locale: Locale): string {
      leaveOtherLobby(host.id);
      const code = generateUniqueLobbyCode(randomInt, (candidate) => lobbies.has(candidate));
      commit(code, createLobby({ code, locale, host, now: now(), config: options.config }));
      return code;
    },

    /** A solo practice race that starts right away; returns its lobby code. */
    startTraining(player: Player, locale: Locale): string {
      return startPrivateRace("training", [player], locale, null);
    },

    /**
     * Joins quick 1v1 matchmaking: races the first other player searching in the same language,
     * or waits (see `quickMatchStatus`). `bot` is the level used if nobody shows up.
     */
    joinQuickMatch(player: Player, locale: Locale, bot: BotDifficulty): QuickMatchStatus {
      const time = now();
      dropStaleSearches(time);
      // Asking again right after being matched (e.g. the page re-ran its effect) returns that match while its race
      // has not started; an older match is forgotten so the player searches anew.
      const current = matchedStatus(player.id);
      if (current?.state === "matched" && lobbies.get(current.code)?.phase === "countdown") return current;
      matches.delete(player.id);
      const own = queue.get(player.id);
      if (own) {
        own.seenAt = time;
        return { state: "searching", waitedMs: time - own.joinedAt };
      }
      const entry: QueueEntry = { player, locale, bot, joinedAt: time, seenAt: time };
      const rival = [...queue.values()].find((candidate) => candidate.locale === locale);
      if (rival) return startQuickMatch(player.id, [rival, entry], null);
      queue.set(player.id, entry);
      return { state: "searching", waitedMs: 0 };
    },

    /** Checked regularly by the searching page; starts a race against a bot once the wait is over. */
    quickMatchStatus(userId: string): QuickMatchStatus {
      const time = now();
      const matched = matchedStatus(userId);
      if (matched) return matched;
      const entry = queue.get(userId);
      if (!entry) return { state: "idle" };
      entry.seenAt = time;
      if (time - entry.joinedAt >= QUICK_MATCH_BOT_DELAY_MS) return startQuickMatch(userId, [entry], entry.bot);
      return { state: "searching", waitedMs: time - entry.joinedAt };
    },

    leaveQuickMatch(userId: string) {
      queue.delete(userId);
      matches.delete(userId);
    },

    join(code: string, player: Player): StoreError | null {
      if (!lobbies.has(code)) return "lobbyNotFound";
      const state = lobbies.get(code);
      if (state && !isMember(state, player.id)) {
        const check = joinLobby(state, player, now());
        if (!check.ok) return check.error;
      }
      leaveOtherLobby(player.id, code);
      return updateOutcome(code, (current, time) => joinLobby(current, player, time));
    },

    leave(code: string, userId: string) {
      update(code, (state) => leaveLobby(state, userId));
    },

    setReady(code: string, userId: string, isReady: boolean): StoreError | null {
      return updateOutcome(code, (state) => setReady(state, userId, isReady));
    },

    start(code: string, userId: string): StoreError | null {
      return updateOutcome(code, (state, time) => startRace(state, userId, pickRaceText(state.settings.language, randomInt, state.settings.numbers), time, random));
    },

    updateSettings(code: string, userId: string, change: unknown): StoreError | null {
      return updateOutcome(code, (state) => updateSettings(state, userId, change));
    },

    setVisibility(code: string, userId: string, visibility: unknown): StoreError | null {
      return updateOutcome(code, (state) => setVisibility(state, userId, visibility));
    },

    /** Public lobbies for the lobby browser: open ones first, then the most players. */
    listPublic(): PublicLobby[] {
      const time = now();
      const isOpen = (lobby: PublicLobby) => Number(lobby.phase === "waiting" || lobby.phase === "finished");
      return [...lobbies.values()]
        .flatMap((state) => publicLobbyFor(advance(state, time)) ?? [])
        .sort((a, b) => isOpen(b) - isOpen(a) || b.playerCount - a.playerCount);
    },

    sendMessage(code: string, userId: string, text: unknown): StoreError | null {
      return updateOutcome(code, (state, time) => sendMessage(state, userId, text, time));
    },

    addBot(code: string, userId: string, difficulty: BotDifficulty): StoreError | null {
      return updateOutcome(code, (state) => addBot(state, userId, difficulty, random));
    },

    removeBot(code: string, userId: string, botId: string): StoreError | null {
      return updateOutcome(code, (state) => removeBot(state, userId, botId));
    },

    input(code: string, userId: string, batch: InputBatch): StoreError | null {
      const state = lobbies.get(code);
      if (!state) return "lobbyNotFound";
      if (!isMember(state, userId)) return "notMember";
      // Progress is broadcast on the next tick, unless the input ended the race.
      const time = now();
      const next = advance(applyInput(advance(state, time), userId, batch, time), time);
      commit(code, next, next.phase !== state.phase);
      return null;
    },

    /** Starts streaming views to a member; returns the unsubscribe function, or null for non-members. */
    subscribe(code: string, userId: string, send: LobbySubscriber): (() => void) | null {
      const state = lobbies.get(code);
      if (!state || !isMember(state, userId)) return null;

      const subscriber = { userId, send };
      const set = subscribers.get(code) ?? new Set();
      set.add(subscriber);
      subscribers.set(code, set);

      const key = `${code}:${userId}`;
      const count = (connections.get(key) ?? 0) + 1;
      connections.set(key, count);
      const before = lobbies.get(code);
      if (count === 1) update(code, (current, time) => setConnected(current, userId, true, time));
      // Already connected elsewhere (another tab): nothing was broadcast, so send the first view directly.
      if (lobbies.get(code) === before) {
        const current = lobbies.get(code);
        send(current ? viewFor(current, userId, now()) : null);
      }

      let active = true;
      return () => {
        if (!active) return;
        active = false;
        set.delete(subscriber);
        if (set.size === 0) subscribers.delete(code);
        const remaining = (connections.get(key) ?? 1) - 1;
        if (remaining > 0) {
          connections.set(key, remaining);
          return;
        }
        connections.delete(key);
        update(code, (current, time) => setConnected(current, userId, false, time));
      };
    },

    view(code: string, userId: string): LobbyView | null {
      const state = lobbies.get(code);
      return state ? viewFor(advance(state, now()), userId, now()) : null;
    },

    result(code: string, userId: string): RaceResult | null {
      const state = lobbies.get(code);
      return state ? resultFor(state, userId) : null;
    },

    exists(code: string): boolean {
      return lobbies.has(code);
    },

    /** Shows a newly chosen character in the player's current lobby, if any. */
    setCharacter(userId: string, character: CharacterId) {
      const code = lobbyOfUser.get(userId);
      if (code) update(code, (state) => setCharacter(state, userId, character));
    },

    lobbyOf(userId: string): string | null {
      return lobbyOfUser.get(userId) ?? null;
    },

    tick,

    dispose() {
      if (timer) clearInterval(timer);
      timer = null;
    },
  };
}

/** Engine steps that cannot fail for a freshly made private lobby. */
function must(outcome: Outcome): LobbyState {
  if (!outcome.ok) throw new Error(`Could not prepare the race: ${outcome.error}`);
  return outcome.state;
}
