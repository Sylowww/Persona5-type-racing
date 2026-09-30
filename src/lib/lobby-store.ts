// In-memory home of every lobby: applies engine rules, runs timers and notifies subscribers.
// State lives in this process only, so the app must run as a single Node instance (see doc/architecture.md).
import type { Locale } from "@/i18n/locales";
import type { BotDifficulty, LobbyView } from "@/types/lobby";
import type { InputBatch, RaceResult } from "@/types/race";
import { generateUniqueLobbyCode, type RandomInt } from "./lobby-code";
import {
  addBot,
  advance,
  applyInput,
  createLobby,
  isMember,
  joinLobby,
  leaveLobby,
  removeBot,
  resultFor,
  setConnected,
  setReady,
  startRace,
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

export type LobbyStoreOptions = {
  config?: Partial<EngineConfig>;
  now?: () => number;
  randomInt?: RandomInt;
  /** Drives bot behavior; defaults to Math.random. */
  random?: () => number;
  /** How often timers run and typing progress is broadcast; null disables the timer (tests call `tick`). */
  tickMs?: number | null;
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

  return {
    create(host: Player, locale: Locale): string {
      leaveOtherLobby(host.id);
      const code = generateUniqueLobbyCode(randomInt, (candidate) => lobbies.has(candidate));
      commit(code, createLobby({ code, locale, host, now: now(), config: options.config }));
      return code;
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
      return updateOutcome(code, (state, time) => startRace(state, userId, pickRaceText(state.locale, randomInt), time, random));
    },

    addBot(code: string, userId: string, difficulty: BotDifficulty): StoreError | null {
      return updateOutcome(code, (state) => addBot(state, userId, difficulty));
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
